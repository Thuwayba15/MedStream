using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Authorization.Users;
using Abp.Domain.Repositories;
using Abp.UI;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.PatientIntake;
using MedStream.QueueOperations.Dto;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace MedStream.QueueOperations;

/// <summary>
/// Application service for clinician queue listing, review, and status transitions.
/// </summary>
[AbpAuthorize]
public class QueueOperationsAppService : MedStreamAppServiceBase, IQueueOperationsAppService
{
    private static readonly IReadOnlyDictionary<string, HashSet<string>> AllowedTransitions =
        new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase)
        {
            [PatientIntakeConstants.QueueStatusWaiting] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                PatientIntakeConstants.QueueStatusCalled,
                PatientIntakeConstants.QueueStatusInConsultation,
                PatientIntakeConstants.QueueStatusCancelled,
            },
            [PatientIntakeConstants.QueueStatusCalled] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                PatientIntakeConstants.QueueStatusWaiting,
                PatientIntakeConstants.QueueStatusInConsultation,
                PatientIntakeConstants.QueueStatusCancelled,
            },
            [PatientIntakeConstants.QueueStatusInConsultation] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                PatientIntakeConstants.QueueStatusCompleted,
                PatientIntakeConstants.QueueStatusCancelled,
            },
            [PatientIntakeConstants.QueueStatusCompleted] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
            [PatientIntakeConstants.QueueStatusCancelled] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
        };

    private readonly IRepository<QueueTicket, long> _queueTicketRepository;
    private readonly IRepository<QueueEvent, long> _queueEventRepository;
    private readonly IRepository<TriageAssessment, long> _triageAssessmentRepository;
    private readonly IRepository<SymptomIntake, long> _symptomIntakeRepository;
    private readonly IRepository<Visit, long> _visitRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly UserManager _userManager;
    private readonly IConfiguration _configuration;

    public QueueOperationsAppService(
        IRepository<QueueTicket, long> queueTicketRepository,
        IRepository<QueueEvent, long> queueEventRepository,
        IRepository<TriageAssessment, long> triageAssessmentRepository,
        IRepository<SymptomIntake, long> symptomIntakeRepository,
        IRepository<Visit, long> visitRepository,
        IRepository<User, long> userRepository,
        UserManager userManager,
        IConfiguration configuration = null)
    {
        _queueTicketRepository = queueTicketRepository;
        _queueEventRepository = queueEventRepository;
        _triageAssessmentRepository = triageAssessmentRepository;
        _symptomIntakeRepository = symptomIntakeRepository;
        _visitRepository = visitRepository;
        _userRepository = userRepository;
        _userManager = userManager;
        _configuration = configuration;
    }

    /// <inheritdoc />
    public async Task<PagedResultDto<ClinicianQueueItemDto>> GetClinicianQueue(GetClinicianQueueInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var tenantId = AbpSession.TenantId ?? 1;
        var facilityId = clinician.ClinicianFacilityId ?? throw new UserFriendlyException("Clinician must be assigned to a facility before viewing queue.");
        var normalizedQueueStatuses = NormalizeFilterValues(input.QueueStatuses);
        var normalizedUrgencyLevels = NormalizeFilterValues(input.UrgencyLevels);
        var normalizedSearch = (input.SearchText ?? string.Empty).Trim().ToLowerInvariant();

        var queueQuery =
            from queueTicket in _queueTicketRepository.GetAll()
            join triageAssessment in _triageAssessmentRepository.GetAll() on queueTicket.TriageAssessmentId equals triageAssessment.Id
            join visit in _visitRepository.GetAll() on queueTicket.VisitId equals visit.Id
            join patientUser in _userRepository.GetAll() on visit.PatientUserId equals patientUser.Id
            where queueTicket.TenantId == tenantId &&
                  queueTicket.FacilityId == facilityId &&
                  queueTicket.IsActive &&
                  !queueTicket.IsDeleted
            select new
            {
                queueTicket.Id,
                queueTicket.VisitId,
                visit.PatientUserId,
                queueTicket.QueueNumber,
                queueTicket.QueueStatus,
                queueTicket.CurrentStage,
                queueTicket.EnteredQueueAt,
                queueTicket.IsActive,
                triageAssessment.UrgencyLevel,
                triageAssessment.PriorityScore,
                PatientName = string.Concat(patientUser.Name, " ", patientUser.Surname),
                UrgencyRank = triageAssessment.UrgencyLevel == "Urgent"
                    ? 0
                    : triageAssessment.UrgencyLevel == "Priority"
                        ? 1
                        : triageAssessment.UrgencyLevel == "Routine"
                            ? 2
                            : 3
            };

        if (normalizedQueueStatuses.Count > 0)
        {
            queueQuery = queueQuery.Where(item => normalizedQueueStatuses.Contains(item.QueueStatus.ToLower()));
        }

        if (normalizedUrgencyLevels.Count > 0)
        {
            queueQuery = queueQuery.Where(item => normalizedUrgencyLevels.Contains(item.UrgencyLevel.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(normalizedSearch))
        {
            queueQuery = queueQuery.Where(item =>
                item.PatientName.ToLower().Contains(normalizedSearch) ||
                item.QueueNumber.ToString().Contains(normalizedSearch));
        }

        var totalCount = await queueQuery.CountAsync();
        var effectiveMaxResultCount = input.MaxResultCount <= 0 ? 50 : Math.Min(input.MaxResultCount, 200);
        var queueRows = await queueQuery
            .OrderBy(item => item.UrgencyRank)
            .ThenByDescending(item => item.PriorityScore)
            .ThenBy(item => item.EnteredQueueAt)
            .Skip(input.SkipCount)
            .Take(effectiveMaxResultCount)
            .ToListAsync();

        var nowUtc = DateTime.UtcNow;
        var outputRows = queueRows.Select(item => new ClinicianQueueItemDto
        {
            QueueTicketId = item.Id,
            VisitId = item.VisitId,
            PatientUserId = item.PatientUserId,
            PatientName = item.PatientName.Trim(),
            QueueNumber = item.QueueNumber,
            QueueStatus = item.QueueStatus,
            CurrentStage = item.CurrentStage,
            UrgencyLevel = item.UrgencyLevel,
            PriorityScore = item.PriorityScore,
            EnteredQueueAt = item.EnteredQueueAt,
            WaitingMinutes = (int)Math.Max(0, (nowUtc - item.EnteredQueueAt).TotalMinutes),
            IsActive = item.IsActive
        }).ToList();

        return new PagedResultDto<ClinicianQueueItemDto>(totalCount, outputRows);
    }

    /// <inheritdoc />
    public async Task<ClinicianQueueReviewDto> GetQueueTicketForReview(GetQueueTicketForReviewInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var tenantId = AbpSession.TenantId ?? 1;
        var facilityId = clinician.ClinicianFacilityId ?? throw new UserFriendlyException("Clinician must be assigned to a facility before reviewing queue tickets.");

        var queueProjection = await (
            from queueTicket in _queueTicketRepository.GetAll()
            join triageAssessment in _triageAssessmentRepository.GetAll() on queueTicket.TriageAssessmentId equals triageAssessment.Id
            join visit in _visitRepository.GetAll() on queueTicket.VisitId equals visit.Id
            join patientUser in _userRepository.GetAll() on visit.PatientUserId equals patientUser.Id
            join symptomIntake in _symptomIntakeRepository.GetAll() on visit.Id equals symptomIntake.VisitId into symptomIntakeGroup
            from symptomIntake in symptomIntakeGroup.DefaultIfEmpty()
            where queueTicket.TenantId == tenantId &&
                  queueTicket.FacilityId == facilityId &&
                  queueTicket.Id == input.Id &&
                  !queueTicket.IsDeleted
            select new
            {
                queueTicket.Id,
                queueTicket.VisitId,
                visit.PatientUserId,
                PatientName = string.Concat(patientUser.Name, " ", patientUser.Surname),
                queueTicket.QueueNumber,
                queueTicket.QueueStatus,
                queueTicket.CurrentStage,
                queueTicket.EnteredQueueAt,
                triageAssessment.UrgencyLevel,
                triageAssessment.PriorityScore,
                triageAssessment.Explanation,
                triageAssessment.RedFlagsDetected,
                ChiefComplaint = symptomIntake != null ? symptomIntake.FreeTextComplaint : null,
                SelectedSymptoms = symptomIntake != null ? symptomIntake.SelectedSymptoms : null,
                ExtractedPrimarySymptoms = symptomIntake != null ? symptomIntake.ExtractedPrimarySymptoms : null,
                FollowUpAnswersJson = symptomIntake != null ? symptomIntake.FollowUpAnswersJson : null,
                SubjectiveSummary = symptomIntake != null ? symptomIntake.SubjectiveSummary : null,
            }).FirstOrDefaultAsync();

        if (queueProjection == null)
        {
            throw new UserFriendlyException("Queue ticket was not found in your facility context.");
        }

        var selectedSymptoms = DeserializeStringList(queueProjection.SelectedSymptoms);
        var extractedPrimarySymptoms = DeserializeStringList(queueProjection.ExtractedPrimarySymptoms);
        var followUpAnswers = DeserializeAnswerDictionary(queueProjection.FollowUpAnswersJson);
        var chiefComplaint = BuildChiefComplaint(queueProjection.ChiefComplaint, selectedSymptoms, extractedPrimarySymptoms, followUpAnswers);
        var reasoning = BuildReasoningItems(queueProjection.Explanation, queueProjection.RedFlagsDetected, followUpAnswers);
        var clinicianSummary = await BuildClinicianSummaryAsync(chiefComplaint, selectedSymptoms, extractedPrimarySymptoms, followUpAnswers, queueProjection.UrgencyLevel, queueProjection.Explanation, reasoning);
        var nowUtc = DateTime.UtcNow;
        return new ClinicianQueueReviewDto
        {
            QueueTicketId = queueProjection.Id,
            VisitId = queueProjection.VisitId,
            PatientUserId = queueProjection.PatientUserId,
            PatientName = queueProjection.PatientName.Trim(),
            QueueNumber = queueProjection.QueueNumber,
            QueueStatus = queueProjection.QueueStatus,
            CurrentStage = queueProjection.CurrentStage,
            EnteredQueueAt = queueProjection.EnteredQueueAt,
            WaitingMinutes = (int)Math.Max(0, (nowUtc - queueProjection.EnteredQueueAt).TotalMinutes),
            UrgencyLevel = queueProjection.UrgencyLevel,
            PriorityScore = queueProjection.PriorityScore,
            TriageExplanation = queueProjection.Explanation,
            RedFlags = DeserializeStringList(queueProjection.RedFlagsDetected),
            Reasoning = reasoning,
            ChiefComplaint = chiefComplaint,
            SelectedSymptoms = selectedSymptoms,
            ExtractedPrimarySymptoms = extractedPrimarySymptoms,
            SubjectiveSummary = queueProjection.SubjectiveSummary ?? string.Empty,
            ClinicianSummary = clinicianSummary,
            ConsultationPath = $"/clinician/consultation?visitId={queueProjection.VisitId}&queueTicketId={queueProjection.Id}",
            PatientHistoryPath = $"/clinician/history?patientUserId={queueProjection.PatientUserId}&visitId={queueProjection.VisitId}",
        };
    }

    /// <inheritdoc />
    public async Task<UpdateQueueTicketStatusOutput> UpdateQueueTicketStatus(UpdateQueueTicketStatusInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var tenantId = AbpSession.TenantId ?? 1;
        var facilityId = clinician.ClinicianFacilityId ?? throw new UserFriendlyException("Clinician must be assigned to a facility before updating queue status.");

        var queueTicket = await _queueTicketRepository.FirstOrDefaultAsync(item =>
            item.TenantId == tenantId &&
            item.FacilityId == facilityId &&
            item.Id == input.QueueTicketId &&
            !item.IsDeleted);
        if (queueTicket == null)
        {
            throw new UserFriendlyException("Queue ticket was not found in your facility context.");
        }

        var oldStatus = queueTicket.QueueStatus;
        var normalizedNewStatus = (input.NewStatus ?? string.Empty).Trim().ToLowerInvariant();
        if (!AllowedTransitions.TryGetValue(oldStatus, out var allowedNewStatuses) || !allowedNewStatuses.Contains(normalizedNewStatus))
        {
            throw new UserFriendlyException($"Invalid queue transition from '{oldStatus}' to '{normalizedNewStatus}'.");
        }

        var changedAt = DateTime.UtcNow;
        queueTicket.QueueStatus = normalizedNewStatus;
        queueTicket.CurrentStage = GetStageLabelForStatus(normalizedNewStatus);
        queueTicket.LastStatusChangedAt = changedAt;
        queueTicket.CurrentClinicianUserId = clinician.Id;

        if (string.Equals(normalizedNewStatus, PatientIntakeConstants.QueueStatusCalled, StringComparison.OrdinalIgnoreCase))
        {
            queueTicket.CalledAt ??= changedAt;
        }

        if (string.Equals(normalizedNewStatus, PatientIntakeConstants.QueueStatusInConsultation, StringComparison.OrdinalIgnoreCase))
        {
            queueTicket.ConsultationStartedAt ??= changedAt;
            queueTicket.ConsultationStartedByClinicianUserId ??= clinician.Id;
        }

        if (string.Equals(normalizedNewStatus, PatientIntakeConstants.QueueStatusCompleted, StringComparison.OrdinalIgnoreCase))
        {
            queueTicket.CompletedAt = changedAt;
            queueTicket.IsActive = false;
        }

        if (string.Equals(normalizedNewStatus, PatientIntakeConstants.QueueStatusCancelled, StringComparison.OrdinalIgnoreCase))
        {
            queueTicket.CancelledAt = changedAt;
            queueTicket.IsActive = false;
        }

        await _queueTicketRepository.UpdateAsync(queueTicket);

        await _queueEventRepository.InsertAsync(new QueueEvent
        {
            TenantId = queueTicket.TenantId,
            QueueTicketId = queueTicket.Id,
            EventType = string.Equals(normalizedNewStatus, PatientIntakeConstants.QueueStatusInConsultation, StringComparison.OrdinalIgnoreCase)
                ? PatientIntakeConstants.QueueEventConsultationStarted
                : PatientIntakeConstants.QueueEventStatusChanged,
            OldStatus = oldStatus,
            NewStatus = normalizedNewStatus,
            ChangedByClinicianUserId = clinician.Id,
            Notes = string.IsNullOrWhiteSpace(input.Note)
                ? $"Queue status changed from '{oldStatus}' to '{normalizedNewStatus}'."
                : input.Note.Trim(),
            EventAt = changedAt,
        });

        var visit = await _visitRepository.GetAsync(queueTicket.VisitId);
        visit.Status = GetVisitStatusForQueueStatus(normalizedNewStatus);
        await _visitRepository.UpdateAsync(visit);

        await CurrentUnitOfWork.SaveChangesAsync();

        return new UpdateQueueTicketStatusOutput
        {
            QueueTicketId = queueTicket.Id,
            OldStatus = oldStatus,
            NewStatus = queueTicket.QueueStatus,
            CurrentStage = queueTicket.CurrentStage,
            ChangedAt = changedAt,
            VisitId = queueTicket.VisitId,
            PatientUserId = visit.PatientUserId,
        };
    }

    /// <inheritdoc />
    [HttpPost]
    public async Task<OverrideQueueTicketUrgencyOutput> OverrideQueueTicketUrgency(OverrideQueueTicketUrgencyInput input)
    {
        var clinician = await EnsureCurrentClinicianAsync();
        var tenantId = AbpSession.TenantId ?? 1;
        var facilityId = clinician.ClinicianFacilityId ?? throw new UserFriendlyException("Clinician must be assigned to a facility before overriding urgency.");
        var normalizedUrgencyLevel = NormalizeUrgencyLevel(input.UrgencyLevel);

        var queueTicket = await _queueTicketRepository.FirstOrDefaultAsync(item =>
            item.TenantId == tenantId &&
            item.FacilityId == facilityId &&
            item.Id == input.QueueTicketId &&
            !item.IsDeleted);
        if (queueTicket == null)
        {
            throw new UserFriendlyException("Queue ticket was not found in your facility context.");
        }

        var triageAssessment = await _triageAssessmentRepository.GetAsync(queueTicket.TriageAssessmentId);
        var previousUrgencyLevel = triageAssessment.UrgencyLevel;

        triageAssessment.UrgencyLevel = normalizedUrgencyLevel;
        triageAssessment.PriorityScore = GetPriorityScoreForUrgency(normalizedUrgencyLevel, triageAssessment.PriorityScore);
        triageAssessment.Explanation = string.IsNullOrWhiteSpace(input.Note)
            ? $"Urgency overridden by clinician to {normalizedUrgencyLevel}."
            : $"{triageAssessment.Explanation} Override: {input.Note.Trim()}".Trim();

        await _triageAssessmentRepository.UpdateAsync(triageAssessment);

        await _queueEventRepository.InsertAsync(new QueueEvent
        {
            TenantId = queueTicket.TenantId,
            QueueTicketId = queueTicket.Id,
            EventType = PatientIntakeConstants.QueueEventStatusChanged,
            OldStatus = queueTicket.QueueStatus,
            NewStatus = queueTicket.QueueStatus,
            ChangedByClinicianUserId = clinician.Id,
            Notes = string.IsNullOrWhiteSpace(input.Note)
                ? $"Urgency overridden from '{previousUrgencyLevel}' to '{normalizedUrgencyLevel}'."
                : $"Urgency overridden from '{previousUrgencyLevel}' to '{normalizedUrgencyLevel}'. {input.Note.Trim()}",
            EventAt = DateTime.UtcNow,
        });

        await CurrentUnitOfWork.SaveChangesAsync();

        return new OverrideQueueTicketUrgencyOutput
        {
            QueueTicketId = queueTicket.Id,
            VisitId = queueTicket.VisitId,
            PatientUserId = (await _visitRepository.GetAsync(queueTicket.VisitId)).PatientUserId,
            PreviousUrgencyLevel = previousUrgencyLevel,
            UrgencyLevel = triageAssessment.UrgencyLevel,
            PriorityScore = triageAssessment.PriorityScore,
        };
    }

    private async Task<User> EnsureCurrentClinicianAsync()
    {
        if (!AbpSession.UserId.HasValue)
        {
            throw new AbpAuthorizationException("Unauthenticated.");
        }

        var user = await _userRepository.GetAsync(AbpSession.UserId.Value);
        var roleNames = await _userManager.GetRolesAsync(user);
        if (!roleNames.Contains(StaticRoleNames.Tenants.Clinician))
        {
            throw new AbpAuthorizationException("Only clinicians may access queue operations.");
        }

        if (user.IsClinicianApprovalPending)
        {
            throw new AbpAuthorizationException("Clinician approval is pending.");
        }

        return user;
    }

    private static string GetStageLabelForStatus(string queueStatus)
    {
        return queueStatus.ToLowerInvariant() switch
        {
            PatientIntakeConstants.QueueStatusWaiting => "Waiting",
            PatientIntakeConstants.QueueStatusCalled => "Called",
            PatientIntakeConstants.QueueStatusInConsultation => "In Consultation",
            PatientIntakeConstants.QueueStatusCompleted => "Completed",
            PatientIntakeConstants.QueueStatusCancelled => "Cancelled",
            _ => "Waiting"
        };
    }

    private static string GetVisitStatusForQueueStatus(string queueStatus)
    {
        return queueStatus.ToLowerInvariant() switch
        {
            PatientIntakeConstants.QueueStatusInConsultation => "InConsultation",
            PatientIntakeConstants.QueueStatusCompleted => "Completed",
            PatientIntakeConstants.QueueStatusCancelled => "Cancelled",
            _ => PatientIntakeConstants.VisitStatusQueued
        };
    }

    private static HashSet<string> NormalizeFilterValues(IEnumerable<string> values)
    {
        return (values ?? Array.Empty<string>())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim().ToLowerInvariant())
            .ToHashSet(StringComparer.Ordinal);
    }

    private static string NormalizeUrgencyLevel(string urgencyLevel)
    {
        return urgencyLevel?.Trim().ToLowerInvariant() switch
        {
            "urgent" => "Urgent",
            "priority" => "Priority",
            "routine" => "Routine",
            _ => throw new UserFriendlyException("Urgency override must be Urgent, Priority, or Routine.")
        };
    }

    private static decimal GetPriorityScoreForUrgency(string urgencyLevel, decimal existingPriorityScore)
    {
        return urgencyLevel switch
        {
            "Urgent" => Math.Max(existingPriorityScore, 90m),
            "Priority" => Math.Clamp(existingPriorityScore, 60m, 89m),
            "Routine" => Math.Min(existingPriorityScore, 59m),
            _ => existingPriorityScore
        };
    }

    private async Task<string> BuildClinicianSummaryAsync(
        string chiefComplaint,
        IReadOnlyList<string> selectedSymptoms,
        IReadOnlyList<string> extractedPrimarySymptoms,
        IReadOnlyDictionary<string, object> followUpAnswers,
        string urgencyLevel,
        string triageExplanation,
        IReadOnlyList<string> reasoning)
    {
        var fallbackSummary = BuildDeterministicClinicianSummary(
            chiefComplaint,
            selectedSymptoms,
            extractedPrimarySymptoms,
            followUpAnswers,
            urgencyLevel,
            triageExplanation,
            reasoning);
        var apiKey = GetOpenAiSetting("OpenAI:ApiKey") ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return fallbackSummary;
        }

        var endpoint = (GetOpenAiSetting("OpenAI:BaseUrl") ?? "https://api.openai.com/v1").TrimEnd('/') + "/chat/completions";
        var model = GetOpenAiSetting("OpenAI:Model") ?? "gpt-4o-mini";

        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var payload = new
        {
            model,
            temperature = 0.1,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = "Write a concise clinician-facing intake summary. Return JSON only with key summary. Mention the main complaint, key symptoms, relevant positives, and any urgent context. Do not diagnose. Keep it to 2-4 short sentences."
                },
                new
                {
                    role = "user",
                    content = JsonConvert.SerializeObject(new
                    {
                        chiefComplaint,
                        selectedSymptoms,
                        extractedPrimarySymptoms,
                        followUpAnswers,
                        urgencyLevel,
                        triageExplanation,
                        reasoning
                    })
                }
            }
        };

        try
        {
            using var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            using var response = await httpClient.PostAsync(endpoint, content);
            if (!response.IsSuccessStatusCode)
            {
                return fallbackSummary;
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(responseJson);
            var completionContent = document.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();
            if (string.IsNullOrWhiteSpace(completionContent))
            {
                return fallbackSummary;
            }

            using var summaryDocument = JsonDocument.Parse(completionContent);
            if (!summaryDocument.RootElement.TryGetProperty("summary", out var summaryElement))
            {
                return fallbackSummary;
            }

            var summary = summaryElement.GetString()?.Trim();
            return string.IsNullOrWhiteSpace(summary) ? fallbackSummary : summary;
        }
        catch
        {
            return fallbackSummary;
        }
    }

    private static string BuildDeterministicClinicianSummary(
        string chiefComplaint,
        IReadOnlyList<string> selectedSymptoms,
        IReadOnlyList<string> extractedPrimarySymptoms,
        IReadOnlyDictionary<string, object> followUpAnswers,
        string urgencyLevel,
        string triageExplanation,
        IReadOnlyList<string> reasoning)
    {
        var summaryParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(chiefComplaint))
        {
            summaryParts.Add($"Primary concern: {chiefComplaint.Trim()}.");
        }

        var symptomSource = selectedSymptoms.Count > 0 ? selectedSymptoms : extractedPrimarySymptoms;
        if (symptomSource.Count > 0)
        {
            summaryParts.Add($"Symptoms reported: {string.Join(", ", symptomSource)}.");
        }

        var positiveAnswers = followUpAnswers
            .Where(item => IsPositiveAnswer(item.Value))
            .Select(item => $"{GetAnswerLabel(item.Key)}: {FormatAnswerValue(item.Value)}")
            .Take(3)
            .ToList();
        if (positiveAnswers.Count > 0)
        {
            summaryParts.Add($"Key positives: {string.Join("; ", positiveAnswers)}.");
        }

        if (!string.IsNullOrWhiteSpace(urgencyLevel))
        {
            summaryParts.Add($"Triage category: {urgencyLevel}.");
        }

        if (!string.IsNullOrWhiteSpace(triageExplanation))
        {
            summaryParts.Add(triageExplanation.Trim().TrimEnd('.') + ".");
        }
        else if (reasoning.Count > 0)
        {
            summaryParts.Add($"Reasoning: {string.Join("; ", reasoning.Take(3))}.");
        }

        return string.Join(" ", summaryParts.Where(item => !string.IsNullOrWhiteSpace(item))).Trim();
    }

    private static List<string> BuildReasoningItems(string triageExplanation, string serializedRedFlags, IReadOnlyDictionary<string, object> followUpAnswers)
    {
        var reasoningItems = new List<string>();
        if (!string.IsNullOrWhiteSpace(triageExplanation))
        {
            reasoningItems.Add(triageExplanation.Trim());
        }

        var redFlags = DeserializeStringList(serializedRedFlags);
        reasoningItems.AddRange(redFlags
            .Select(item => MapReasoningCode(item, followUpAnswers))
            .Where(item => !string.IsNullOrWhiteSpace(item)));

        var urgentCheckReasons = new[]
        {
            "urgentSevereBreathing",
            "urgentSevereChestPain",
            "urgentUncontrolledBleeding",
            "urgentCollapse",
            "urgentConfusion"
        }
        .Where(key => GetBooleanAnswer(followUpAnswers, key))
        .Select(GetAnswerLabel);

        reasoningItems.AddRange(urgentCheckReasons);

        return reasoningItems
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string BuildChiefComplaint(
        string freeTextComplaint,
        IReadOnlyList<string> selectedSymptoms,
        IReadOnlyList<string> extractedPrimarySymptoms,
        IReadOnlyDictionary<string, object> followUpAnswers)
    {
        if (!string.IsNullOrWhiteSpace(freeTextComplaint))
        {
            return freeTextComplaint.Trim();
        }

        if (TryGetStringAnswer(followUpAnswers, "mainConcern", out var mainConcern))
        {
            return mainConcern;
        }

        var urgentComplaint = BuildUrgentChiefComplaint(followUpAnswers);
        if (!string.IsNullOrWhiteSpace(urgentComplaint))
        {
            return urgentComplaint;
        }

        var firstSelectedSymptom = selectedSymptoms?.FirstOrDefault(item => !string.IsNullOrWhiteSpace(item));
        if (!string.IsNullOrWhiteSpace(firstSelectedSymptom))
        {
            return firstSelectedSymptom.Trim();
        }

        var firstExtractedSymptom = extractedPrimarySymptoms?.FirstOrDefault(item => !string.IsNullOrWhiteSpace(item));
        if (!string.IsNullOrWhiteSpace(firstExtractedSymptom))
        {
            return firstExtractedSymptom.Trim();
        }

        return string.Empty;
    }

    private static string BuildUrgentChiefComplaint(IReadOnlyDictionary<string, object> followUpAnswers)
    {
        var urgentConcerns = new List<string>();
        if (GetBooleanAnswer(followUpAnswers, "urgentSevereBreathing"))
        {
            urgentConcerns.Add("Severe breathing difficulty");
        }

        if (GetBooleanAnswer(followUpAnswers, "urgentSevereChestPain"))
        {
            urgentConcerns.Add("Severe chest pain");
        }

        if (GetBooleanAnswer(followUpAnswers, "urgentUncontrolledBleeding"))
        {
            urgentConcerns.Add("Uncontrolled bleeding");
        }

        if (GetBooleanAnswer(followUpAnswers, "urgentCollapse"))
        {
            urgentConcerns.Add("Collapse or blackout");
        }

        if (GetBooleanAnswer(followUpAnswers, "urgentConfusion"))
        {
            urgentConcerns.Add("Acute confusion");
        }

        return urgentConcerns.Count > 0 ? string.Join(", ", urgentConcerns) : string.Empty;
    }

    private static List<string> DeserializeStringList(string serializedList)
    {
        if (string.IsNullOrWhiteSpace(serializedList))
        {
            return new List<string>();
        }

        try
        {
            return JsonConvert.DeserializeObject<List<string>>(serializedList) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private static Dictionary<string, object> DeserializeAnswerDictionary(string serializedDictionary)
    {
        if (string.IsNullOrWhiteSpace(serializedDictionary))
        {
            return new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        }

        try
        {
            return JsonConvert.DeserializeObject<Dictionary<string, object>>(serializedDictionary)
                   ?? new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        }
        catch
        {
            return new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        }
    }

    private static string MapReasoningCode(string code, IReadOnlyDictionary<string, object> followUpAnswers)
    {
        return code?.Trim() switch
        {
            "global_urgent_check_positive" => BuildUrgentReasoningFromAnswers(followUpAnswers),
            "urgent_global_red_flag" => BuildUrgentReasoningFromAnswers(followUpAnswers),
            "urgent_keyword_detected" => "Complaint text included urgent warning signs.",
            _ => HumanizeReasoningCode(code)
        };
    }

    private static string BuildUrgentReasoningFromAnswers(IReadOnlyDictionary<string, object> followUpAnswers)
    {
        var labels = new[]
        {
            "urgentSevereBreathing",
            "urgentSevereChestPain",
            "urgentUncontrolledBleeding",
            "urgentCollapse",
            "urgentConfusion"
        }
        .Where(key => GetBooleanAnswer(followUpAnswers, key))
        .Select(GetAnswerLabel)
        .ToList();

        return labels.Count > 0
            ? $"Emergency safety checks were positive: {string.Join(", ", labels)}."
            : "Emergency safety checks were positive.";
    }

    private static string HumanizeReasoningCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return string.Empty;
        }

        var normalized = code.Replace("_", " ").Replace("-", " ").Trim();
        return char.ToUpperInvariant(normalized[0]) + normalized.Substring(1);
    }

    private static bool TryGetStringAnswer(IReadOnlyDictionary<string, object> answers, string key, out string value)
    {
        value = string.Empty;
        if (answers == null || !answers.TryGetValue(key, out var answer) || answer == null)
        {
            return false;
        }

        value = FormatAnswerValue(answer);
        return !string.IsNullOrWhiteSpace(value);
    }

    private static bool GetBooleanAnswer(IReadOnlyDictionary<string, object> answers, string key)
    {
        if (answers == null || !answers.TryGetValue(key, out var answer) || answer == null)
        {
            return false;
        }

        if (answer is bool booleanValue)
        {
            return booleanValue;
        }

        if (bool.TryParse(Convert.ToString(answer), out var parsedBoolean))
        {
            return parsedBoolean;
        }

        return false;
    }

    private static bool IsPositiveAnswer(object answer)
    {
        if (answer == null)
        {
            return false;
        }

        if (answer is bool booleanValue)
        {
            return booleanValue;
        }

        if (answer is string stringValue)
        {
            return !string.IsNullOrWhiteSpace(stringValue) &&
                   !string.Equals(stringValue, "false", StringComparison.OrdinalIgnoreCase) &&
                   !string.Equals(stringValue, "[]", StringComparison.OrdinalIgnoreCase);
        }

        if (answer is IEnumerable enumerable && answer is not string)
        {
            return enumerable.Cast<object>().Any();
        }

        return true;
    }

    private static string GetAnswerLabel(string key)
    {
        return key switch
        {
            "urgentSevereBreathing" => "Severe difficulty breathing reported",
            "urgentSevereChestPain" => "Severe chest pain reported",
            "urgentUncontrolledBleeding" => "Uncontrolled bleeding reported",
            "urgentCollapse" => "Collapse or blackout reported",
            "urgentConfusion" => "Confusion or reduced responsiveness reported",
            "mainConcern" => "Main concern",
            "symptomDurationDays" => "Duration",
            "durationDays" => "Duration",
            "pregnant" => "Pregnancy reported",
            "vomiting" => "Vomiting reported",
            "severePain" => "Severe pain reported",
            "yellowEyesSkin" => "Jaundice reported",
            "noStoolWind" => "Unable to pass stool or wind",
            "fainting" => "Fainting reported",
            _ => HumanizeReasoningCode(key)
        };
    }

    private static string FormatAnswerValue(object answer)
    {
        if (answer == null)
        {
            return string.Empty;
        }

        if (answer is bool booleanValue)
        {
            return booleanValue ? "Yes" : "No";
        }

        if (answer is IEnumerable enumerable && answer is not string)
        {
            var values = enumerable
                .Cast<object>()
                .Select(item => Convert.ToString(item)?.Trim())
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .ToList();
            return values.Count == 0 ? string.Empty : string.Join(", ", values);
        }

        return Convert.ToString(answer)?.Trim() ?? string.Empty;
    }

    private string GetOpenAiSetting(string key)
    {
        return _configuration?[key];
    }
}
