#nullable enable
using Abp.UI;
using MedStream.PatientIntake.Dto;
using MedStream.PatientIntake.Pathways;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.PatientIntake;

public partial class PatientIntakeAppService
{
    /// <inheritdoc />
    public async Task<UrgentCheckOutput> UrgentCheck(UrgentCheckInput input)
    {
        var visit = await GetVisitForCurrentPatientAsync(input.VisitId);
        var urgentAnswers = input.Answers ?? new Dictionary<string, object>();
        var safePathwayKey = string.IsNullOrWhiteSpace(input.PathwayKey)
            ? visit.PathwayKey
            : input.PathwayKey.Trim();
        if (string.IsNullOrWhiteSpace(safePathwayKey) || string.Equals(safePathwayKey, PatientIntakeConstants.UnassignedPathwayKey, StringComparison.OrdinalIgnoreCase))
        {
            safePathwayKey = PatientIntakeConstants.GeneralFallbackPathwayKey;
        }

        var execution = _pathwayExecutionEngine.Execute(new PathwayExecutionRequest
        {
            PathwayId = safePathwayKey,
            StageId = "urgent_check",
            Audience = "patient",
            PrimarySymptoms = input.ExtractedPrimarySymptoms ?? new List<string>(),
            Answers = urgentAnswers,
            Observations = new Dictionary<string, object>()
        });

        var globalUrgentReasons = EvaluateGlobalUrgency(input.FreeText, urgentAnswers);
        var pathwayUrgentReasons = execution.TriggeredRedFlags
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var urgentReasons = globalUrgentReasons
            .Concat(pathwayUrgentReasons)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var isUrgent = urgentReasons.Count > 0 || string.Equals(execution.TriageIndicators.GetValueOrDefault("urgencyLevel"), "Urgent", StringComparison.OrdinalIgnoreCase);
        var intakeMode = string.IsNullOrWhiteSpace(input.IntakeMode) ? PatientIntakeConstants.IntakeModeApprovedJson : input.IntakeMode.Trim();
        var fallbackSummaryIds = input.FallbackSummaryIds ?? new List<string>();
        var questionSet = BuildUrgentCheckQuestionSet();

        Logger.Info($"[Intake][UrgentCheck] pathway={safePathwayKey}, intakeMode={intakeMode}, urgent={isUrgent}, questionCount={questionSet.Count}, reasons={string.Join(", ", urgentReasons)}");
        return new UrgentCheckOutput
        {
            QuestionSet = questionSet,
            IsUrgent = isUrgent,
            ShouldFastTrack = isUrgent,
            TriggerReasons = urgentReasons,
            IntakeMode = intakeMode,
            FallbackSummaryIds = fallbackSummaryIds,
            Message = isUrgent
                ? "Urgent signs detected. We are fast-tracking your intake."
                : "Urgent check completed. Continue to symptom intake."
        };
    }

    /// <inheritdoc />
    public async Task<AssessTriageOutput> AssessTriage(AssessTriageInput input)
    {
        if (input.ExtractedPrimarySymptoms == null || input.ExtractedPrimarySymptoms.Count == 0)
        {
            if (!HasGlobalUrgentPositiveAnswers(input.Answers))
            {
                throw new UserFriendlyException("At least one extracted symptom is required before triage.");
            }
        }

        var visit = await GetVisitForCurrentPatientAsync(input.VisitId);
        var intake = await GetOrCreateIntakeAsync(visit.Id, visit.TenantId);
        var safePathwayKey = string.IsNullOrWhiteSpace(visit.PathwayKey) || string.Equals(visit.PathwayKey, PatientIntakeConstants.UnassignedPathwayKey, StringComparison.OrdinalIgnoreCase)
            ? PatientIntakeConstants.GeneralFallbackPathwayKey
            : visit.PathwayKey;
        var safeAnswers = input.Answers ?? new Dictionary<string, object>();
        var safeObservations = input.Observations ?? new Dictionary<string, object>();
        var mergedTriage = ResolveMergedTriageAssessment(input, safePathwayKey, safeAnswers, safeObservations);

        var hasGlobalUrgent = HasGlobalUrgentPositiveAnswers(safeAnswers);
        var resolvedRedFlags = mergedTriage.Execution.TriggeredRedFlags ?? new List<string>();
        if (hasGlobalUrgent && !resolvedRedFlags.Contains("global_urgent_check_positive", StringComparer.OrdinalIgnoreCase))
        {
            resolvedRedFlags = resolvedRedFlags
                .Concat(new[] { "global_urgent_check_positive" })
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        var resolvedUrgency = mergedTriage.UrgencyLevel;
        var resolvedExplanation = mergedTriage.Explanation;
        var resolvedPriorityScore = mergedTriage.PriorityScore;

        if (hasGlobalUrgent)
        {
            resolvedUrgency = "Urgent";
            resolvedPriorityScore = Math.Max(resolvedPriorityScore, 95m);
            resolvedExplanation = "Urgent triage because one or more emergency safety checks were positive.";
        }

        var triage = new TriageResultDto
        {
            UrgencyLevel = resolvedUrgency,
            Explanation = resolvedExplanation,
            RedFlags = resolvedRedFlags
        };

        var assessedAt = DateTime.UtcNow;
        intake.FollowUpAnswersJson = JsonConvert.SerializeObject(safeAnswers);
        intake.SubjectiveSummary = BuildSubjectiveSummary(visit.PathwayKey, intake, safeAnswers);
        intake.SubmittedAt = assessedAt;

        var triageEntity = new TriageAssessment
        {
            TenantId = visit.TenantId,
            VisitId = visit.Id,
            UrgencyLevel = triage.UrgencyLevel,
            PriorityScore = resolvedPriorityScore,
            Explanation = triage.Explanation,
            RedFlagsDetected = SerializeStringList(triage.RedFlags),
            PositionPending = false,
            QueueMessage = string.Empty,
            LastQueueUpdatedAt = assessedAt,
            AssessedAt = assessedAt
        };

        await _symptomIntakeRepository.UpdateAsync(intake);
        triageEntity = await _triageAssessmentRepository.InsertAsync(triageEntity);
        await CurrentUnitOfWork.SaveChangesAsync();

        var queueTicket = await GetOrCreateActiveQueueTicketAsync(visit, triageEntity, assessedAt);
        triageEntity.QueueMessage = BuildQueueStatus(queueTicket, triage.UrgencyLevel);
        triageEntity.LastQueueUpdatedAt = queueTicket.LastStatusChangedAt;
        triageEntity.PositionPending = false;

        visit.Status = PatientIntakeConstants.VisitStatusQueued;
        await _visitRepository.UpdateAsync(visit);
        await _triageAssessmentRepository.UpdateAsync(triageEntity);
        await CurrentUnitOfWork.SaveChangesAsync();

        return BuildPatientQueueStatusOutput(triageEntity, queueTicket, mergedTriage.Execution);
    }

    /// <inheritdoc />
    public async Task<AssessTriageOutput> GetCurrentQueueStatus(GetCurrentQueueStatusInput input)
    {
        if (input.VisitId <= 0)
        {
            throw new UserFriendlyException("Visit id is required.");
        }

        var visit = await GetVisitForCurrentPatientAsync(input.VisitId);
        var triageAssessment = await _triageAssessmentRepository.FirstOrDefaultAsync(item =>
            item.TenantId == visit.TenantId &&
            item.VisitId == visit.Id &&
            !item.IsDeleted);
        if (triageAssessment == null)
        {
            throw new UserFriendlyException("Triage assessment was not found for this visit.");
        }

        var queueTicket = await _queueTicketRepository.GetAll()
            .Where(item => item.TenantId == visit.TenantId && item.VisitId == visit.Id && !item.IsDeleted)
            .OrderByDescending(item => item.LastStatusChangedAt)
            .FirstOrDefaultAsync();
        if (queueTicket == null)
        {
            throw new UserFriendlyException("Queue ticket was not found for this visit.");
        }

        return BuildPatientQueueStatusOutput(triageAssessment, queueTicket);
    }

    private AssessTriageOutput BuildPatientQueueStatusOutput(
        TriageAssessment triageAssessment,
        QueueTicket queueTicket,
        PathwayExecutionResult? pathwayExecution = null)
    {
        return new AssessTriageOutput
        {
            Triage = new TriageResultDto
            {
                UrgencyLevel = triageAssessment.UrgencyLevel,
                Explanation = triageAssessment.Explanation,
                RedFlags = DeserializeList(triageAssessment.RedFlagsDetected)
            },
            Queue = new QueueStatusDto
            {
                QueueTicketId = queueTicket.Id,
                QueueNumber = queueTicket.QueueNumber,
                QueueStatus = queueTicket.QueueStatus,
                CurrentStage = queueTicket.CurrentStage,
                PositionPending = triageAssessment.PositionPending,
                Message = BuildQueueStatus(queueTicket, triageAssessment.UrgencyLevel),
                LastUpdatedAt = queueTicket.LastStatusChangedAt,
                EnteredQueueAt = queueTicket.EnteredQueueAt
            },
            Execution = new PathwayExecutionSummaryDto
            {
                TriggeredRedFlags = pathwayExecution?.TriggeredRedFlags ?? DeserializeList(triageAssessment.RedFlagsDetected),
                TriageIndicators = pathwayExecution?.TriageIndicators ?? new Dictionary<string, string>
                {
                    ["urgencyLevel"] = triageAssessment.UrgencyLevel,
                    ["explanation"] = triageAssessment.Explanation
                },
                TriggeredOutcomeIds = new List<string>(),
                TriggeredRecommendationIds = new List<string>(),
                TriggeredLinks = new List<PathwayTriggeredLinkDto>(),
                RuleTrace = new List<PathwayRuleTraceDto>()
            }
        };
    }

    private static List<string> EvaluateGlobalUrgency(string freeText, IReadOnlyDictionary<string, object> answers)
    {
        var reasons = new List<string>();
        if (GetBooleanAnswer(answers, "urgentSevereBreathing") ||
            GetBooleanAnswer(answers, "urgentSevereChestPain") ||
            GetBooleanAnswer(answers, "urgentUncontrolledBleeding") ||
            GetBooleanAnswer(answers, "urgentConfusion") ||
            GetBooleanAnswer(answers, "urgentCollapse"))
        {
            reasons.Add("global_urgent_check_positive");
        }

        var normalized = (freeText ?? string.Empty).ToLowerInvariant();
        if (normalized.Contains("can't breathe", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("cannot breathe", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("struggling to breathe", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("severe chest pain", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("bleeding heavily", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("passed out", StringComparison.OrdinalIgnoreCase))
        {
            reasons.Add("urgent_keyword_detected");
        }

        return reasons;
    }

    private static List<IntakeQuestionDto> BuildUrgentCheckQuestionSet()
    {
        return new List<IntakeQuestionDto>
        {
            new() { QuestionKey = "urgentSevereBreathing", QuestionText = "Are you struggling to breathe right now?", InputType = "Boolean", DisplayOrder = 1, IsRequired = true },
            new() { QuestionKey = "urgentSevereChestPain", QuestionText = "Do you have severe chest pain right now?", InputType = "Boolean", DisplayOrder = 2, IsRequired = true },
            new() { QuestionKey = "urgentUncontrolledBleeding", QuestionText = "Do you have heavy bleeding that is not stopping?", InputType = "Boolean", DisplayOrder = 3, IsRequired = true },
            new() { QuestionKey = "urgentCollapse", QuestionText = "Did you faint, collapse, or lose consciousness today?", InputType = "Boolean", DisplayOrder = 4, IsRequired = true },
            new() { QuestionKey = "urgentConfusion", QuestionText = "Are you currently confused, unusually sleepy, or difficult to wake?", InputType = "Boolean", DisplayOrder = 5, IsRequired = true }
        };
    }

    private static bool HasGlobalUrgentPositiveAnswers(IReadOnlyDictionary<string, object>? answers)
    {
        var safeAnswers = answers ?? new Dictionary<string, object>();
        return GetBooleanAnswer(safeAnswers, "urgentSevereBreathing") ||
               GetBooleanAnswer(safeAnswers, "urgentSevereChestPain") ||
               GetBooleanAnswer(safeAnswers, "urgentUncontrolledBleeding") ||
               GetBooleanAnswer(safeAnswers, "urgentCollapse") ||
               GetBooleanAnswer(safeAnswers, "urgentConfusion");
    }

    private static bool GetBooleanAnswer(IReadOnlyDictionary<string, object> answers, string key)
    {
        if (!answers.TryGetValue(key, out var value) || value == null)
        {
            return false;
        }

        if (value is bool boolValue)
        {
            return boolValue;
        }

        if (value is string stringValue)
        {
            return string.Equals(stringValue.Trim(), "true", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(stringValue.Trim(), "yes", StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    private static string BuildQueueStatus(QueueTicket queueTicket, string urgencyLevel)
    {
        if (string.Equals(queueTicket.QueueStatus, PatientIntakeConstants.QueueStatusCalled, StringComparison.OrdinalIgnoreCase))
        {
            return $"Queue #{queueTicket.QueueNumber}: clinician is ready to see you.";
        }

        if (string.Equals(queueTicket.QueueStatus, PatientIntakeConstants.QueueStatusInConsultation, StringComparison.OrdinalIgnoreCase))
        {
            return $"Queue #{queueTicket.QueueNumber}: consultation is in progress.";
        }

        if (string.Equals(queueTicket.QueueStatus, PatientIntakeConstants.QueueStatusCompleted, StringComparison.OrdinalIgnoreCase))
        {
            return $"Queue #{queueTicket.QueueNumber}: consultation completed.";
        }

        if (string.Equals(queueTicket.QueueStatus, PatientIntakeConstants.QueueStatusCancelled, StringComparison.OrdinalIgnoreCase))
        {
            return $"Queue #{queueTicket.QueueNumber}: queue entry cancelled.";
        }

        if (string.Equals(urgencyLevel, "Urgent", StringComparison.Ordinal))
        {
            return $"Queue #{queueTicket.QueueNumber}: urgent case flagged for immediate clinical attention.";
        }

        if (string.Equals(urgencyLevel, "Priority", StringComparison.Ordinal))
        {
            return $"Queue #{queueTicket.QueueNumber}: marked as priority and currently waiting.";
        }

        return $"Queue #{queueTicket.QueueNumber}: checked in and waiting for clinician call.";
    }
}
