using Abp.Authorization;
using Abp.MultiTenancy;
using MedStream.Authorization.Accounts;
using MedStream.Authorization.Accounts.Dto;
using MedStream.Facilities;
using MedStream.Facilities.Dto;
using MedStream.PatientAccess;
using MedStream.PatientIntake;
using MedStream.PatientTimeline;
using MedStream.PatientTimeline.Dto;
using MedStream.Users;
using MedStream.Users.Dto;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace MedStream.Tests.PatientTimeline;

public class PatientTimelineAppService_Tests : MedStreamTestBase
{
    private static int _clinicianIdentitySequence = 2000000;

    private readonly IAccountAppService _accountAppService;
    private readonly IUserAppService _userAppService;
    private readonly IFacilityAppService _facilityAppService;
    private readonly IPatientTimelineAppService _patientTimelineAppService;

    public PatientTimelineAppService_Tests()
    {
        _accountAppService = Resolve<IAccountAppService>();
        _userAppService = Resolve<IUserAppService>();
        _facilityAppService = Resolve<IFacilityAppService>();
        _patientTimelineAppService = Resolve<IPatientTimelineAppService>();
    }

    [Fact]
    public async Task GetPatientTimeline_Should_Aggregate_CrossFacility_Visits_And_Write_Audit()
    {
        var secondaryFacilityId = await CreateFacilityAsync("Timeline Facility B");
        var clinicianEmail = await RegisterAndApproveClinicianWithFacilityAsync("timeline-clinician", 1);
        var patientEmail = await RegisterPatientAsync("timeline-patient");
        var patientUserId = await GetUserIdByEmailAsync(patientEmail);
        var clinicianUserId = await GetUserIdByEmailAsync(clinicianEmail);

        await SeedVisitAsync(
            patientUserId,
            clinicianUserId,
            facilityId: 1,
            visitDate: DateTime.UtcNow.AddDays(-2),
            queueNumber: 2001,
            clinicianTimelineSummary: "Clinician summary for first visit.",
            patientTimelineSummary: "Patient summary for first visit.",
            includeFallbackOnly: false);

        await SeedVisitAsync(
            patientUserId,
            clinicianUserId,
            facilityId: secondaryFacilityId,
            visitDate: DateTime.UtcNow.AddDays(-1),
            queueNumber: 2002,
            clinicianTimelineSummary: string.Empty,
            patientTimelineSummary: string.Empty,
            includeFallbackOnly: true);

        LoginAsTenant(AbpTenantBase.DefaultTenantName, clinicianEmail);
        var timeline = await _patientTimelineAppService.GetPatientTimeline(new GetPatientTimelineInput
        {
            PatientUserId = patientUserId
        });

        timeline.IsClinicianView.ShouldBeTrue();
        timeline.Patient.PatientUserId.ShouldBe(patientUserId);
        timeline.Visits.Count.ShouldBe(2);
        timeline.Visits.Any(item => item.FacilityName == "Timeline Facility B").ShouldBeTrue();
        timeline.Visits.Any(item => item.FacilityName != "Unknown facility").ShouldBeTrue();
        timeline.Visits.Any(item => item.Summary == "Clinician summary for first visit.").ShouldBeTrue();
        timeline.Visits.Any(item => item.SummarySource == "derived_fallback").ShouldBeTrue();
        timeline.Timeline.Any(item => item.EventType == "consultation").ShouldBeTrue();

        await UsingDbContextAsync(async context =>
        {
            var auditEntries = await context.PatientAccessAudits
                .Where(item => item.PatientUserId == patientUserId && item.ClinicianUserId == clinicianUserId)
                .ToListAsync();

            auditEntries.Count.ShouldBe(1);
            auditEntries[0].AccessType.ShouldBe(PatientAccessConstants.AccessTypeTimelineRead);
            auditEntries[0].AccessReason.ShouldBe(PatientAccessConstants.AccessReasonAssignedVisit);
        });
    }

    [Fact]
    public async Task GetPatientTimeline_Should_Reject_Clinician_Without_Assignment_Or_Grant()
    {
        var clinicianOwnerEmail = await RegisterAndApproveClinicianWithFacilityAsync("timeline-owner", 1);
        var clinicianBlockedEmail = await RegisterAndApproveClinicianWithFacilityAsync("timeline-blocked", 1);
        var patientEmail = await RegisterPatientAsync("timeline-patient-blocked");
        var patientUserId = await GetUserIdByEmailAsync(patientEmail);
        var ownerUserId = await GetUserIdByEmailAsync(clinicianOwnerEmail);
        var blockedUserId = await GetUserIdByEmailAsync(clinicianBlockedEmail);

        await SeedVisitAsync(
            patientUserId,
            ownerUserId,
            facilityId: 1,
            visitDate: DateTime.UtcNow.AddHours(-8),
            queueNumber: 3001,
            clinicianTimelineSummary: "Owner summary.",
            patientTimelineSummary: "Patient summary.",
            includeFallbackOnly: false);

        LoginAsTenant(AbpTenantBase.DefaultTenantName, clinicianBlockedEmail);
        await Should.ThrowAsync<AbpAuthorizationException>(async () =>
        {
            await _patientTimelineAppService.GetPatientTimeline(new GetPatientTimelineInput
            {
                PatientUserId = patientUserId
            });
        });

        await UsingDbContextAsync(async context =>
        {
            var blockedAudits = await context.PatientAccessAudits
                .Where(item => item.PatientUserId == patientUserId && item.ClinicianUserId == blockedUserId)
                .ToListAsync();
            blockedAudits.ShouldBeEmpty();
        });
    }

    [Fact]
    public async Task GetPatientTimeline_Should_Allow_Active_Grant_And_Audit_Grant_Reason()
    {
        var ownerClinicianEmail = await RegisterAndApproveClinicianWithFacilityAsync("timeline-owner-grant", 1);
        var grantedClinicianEmail = await RegisterAndApproveClinicianWithFacilityAsync("timeline-granted", 1);
        var patientEmail = await RegisterPatientAsync("timeline-patient-grant");
        var patientUserId = await GetUserIdByEmailAsync(patientEmail);
        var ownerUserId = await GetUserIdByEmailAsync(ownerClinicianEmail);
        var grantedUserId = await GetUserIdByEmailAsync(grantedClinicianEmail);
        var visitId = await SeedVisitAsync(
            patientUserId,
            ownerUserId,
            facilityId: 1,
            visitDate: DateTime.UtcNow.AddHours(-4),
            queueNumber: 4001,
            clinicianTimelineSummary: "Owner-only summary.",
            patientTimelineSummary: "Patient summary.",
            includeFallbackOnly: false);

        await UsingDbContextAsync(async context =>
        {
            await context.PatientAccessGrants.AddAsync(new PatientAccessGrant
            {
                TenantId = 1,
                PatientUserId = patientUserId,
                ClinicianUserId = grantedUserId,
                VisitId = visitId,
                FacilityId = 1,
                IsActive = true,
                GrantedAt = DateTime.UtcNow.AddMinutes(-10),
                ExpiresAt = DateTime.UtcNow.AddDays(1),
                Reason = "Cross-facility follow-up."
            });
        });

        LoginAsTenant(AbpTenantBase.DefaultTenantName, grantedClinicianEmail);
        var timeline = await _patientTimelineAppService.GetPatientTimeline(new GetPatientTimelineInput
        {
            PatientUserId = patientUserId
        });

        timeline.Visits.Count.ShouldBeGreaterThan(0);
        timeline.IsClinicianView.ShouldBeTrue();

        await UsingDbContextAsync(async context =>
        {
            var audit = await context.PatientAccessAudits
                .Where(item => item.PatientUserId == patientUserId && item.ClinicianUserId == grantedUserId)
                .OrderByDescending(item => item.AccessedAt)
                .FirstOrDefaultAsync();

            audit.ShouldNotBeNull();
            audit.AccessReason.ShouldBe(PatientAccessConstants.AccessReasonActiveGrant);
        });
    }

    [Fact]
    public async Task GetMyTimeline_Should_Return_Patient_View_With_Patient_Summary()
    {
        var clinicianEmail = await RegisterAndApproveClinicianWithFacilityAsync("timeline-self-clinician", 1);
        var patientEmail = await RegisterPatientAsync("timeline-self-patient");
        var patientUserId = await GetUserIdByEmailAsync(patientEmail);
        var clinicianUserId = await GetUserIdByEmailAsync(clinicianEmail);

        await SeedVisitAsync(
            patientUserId,
            clinicianUserId,
            facilityId: 1,
            visitDate: DateTime.UtcNow.AddHours(-2),
            queueNumber: 5001,
            clinicianTimelineSummary: "Internal clinician phrasing.",
            patientTimelineSummary: "Patient-safe summary wording.",
            includeFallbackOnly: false);

        LoginAsTenant(AbpTenantBase.DefaultTenantName, patientEmail);
        var timeline = await _patientTimelineAppService.GetMyTimeline();

        timeline.IsClinicianView.ShouldBeFalse();
        timeline.Patient.PatientUserId.ShouldBe(patientUserId);
        timeline.Patient.IdNumber.ShouldBeNull();
        timeline.Visits.Count.ShouldBe(1);
        timeline.Visits[0].Summary.ShouldBe("Patient-safe summary wording.");
        timeline.Visits[0].UrgencyLevel.ShouldBeNull();
    }

    private async Task<int> CreateFacilityAsync(string name)
    {
        LoginAsDefaultTenantAdmin();
        var facility = await _facilityAppService.CreateAsync(new CreateUpdateFacilityDto
        {
            Name = name,
            Code = $"CODE-{Guid.NewGuid():N}".Substring(0, 12),
            FacilityType = "Clinic",
            Province = "Western Cape",
            District = "Cape Town",
            Address = "100 Main Road",
            IsActive = true
        });
        return facility.Id;
    }

    private async Task<string> RegisterAndApproveClinicianWithFacilityAsync(string prefix, int facilityId)
    {
        var clinicianEmail = $"{prefix}-{Guid.NewGuid():N}@medstream.test";
        var clinicianIdNumber = CreateUniqueClinicianIdNumber();
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Timeline",
            LastName = "Clinician",
            EmailAddress = clinicianEmail,
            PhoneNumber = "0820000000",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Clinician",
            IdNumber = clinicianIdNumber,
            ProfessionType = "Doctor",
            RegulatoryBody = "HPCSA",
            RegistrationNumber = $"HPCSA-{Guid.NewGuid():N}".Substring(0, 18),
            RequestedFacilityId = facilityId
        });

        LoginAsDefaultTenantAdmin();
        var clinicianUserId = await GetUserIdByEmailAsync(clinicianEmail);
        await _userAppService.ApproveClinician(new ClinicianApprovalDecisionInput
        {
            Id = clinicianUserId,
            DecisionReason = "Timeline access test approval."
        });
        await _facilityAppService.AssignClinician(new AssignClinicianFacilityInput
        {
            ClinicianUserId = clinicianUserId,
            FacilityId = facilityId
        });

        return clinicianEmail;
    }

    private static string CreateUniqueClinicianIdNumber()
    {
        return $"900101{System.Threading.Interlocked.Increment(ref _clinicianIdentitySequence):D7}";
    }

    private async Task<string> RegisterPatientAsync(string prefix)
    {
        var patientEmail = $"{prefix}-{Guid.NewGuid():N}@medstream.test";
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Timeline",
            LastName = "Patient",
            EmailAddress = patientEmail,
            PhoneNumber = "0810000000",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Patient"
        });
        return patientEmail;
    }

    private async Task<long> GetUserIdByEmailAsync(string emailAddress)
    {
        return await UsingDbContextAsync(async context =>
            await context.Users
                .Where(item => item.TenantId == 1 && item.EmailAddress == emailAddress)
                .Select(item => item.Id)
                .SingleAsync());
    }

    private async Task<long> SeedVisitAsync(
        long patientUserId,
        long clinicianUserId,
        int facilityId,
        DateTime visitDate,
        int queueNumber,
        string clinicianTimelineSummary,
        string patientTimelineSummary,
        bool includeFallbackOnly)
    {
        return await UsingDbContextAsync(async context =>
        {
            var visit = new Visit
            {
                TenantId = 1,
                PatientUserId = patientUserId,
                FacilityId = facilityId,
                AssignedClinicianUserId = clinicianUserId,
                VisitDate = visitDate,
                Status = PatientIntakeConstants.VisitStatusCompleted,
                PathwayKey = PatientIntakeConstants.GeneralFallbackPathwayKey
            };
            await context.Visits.AddAsync(visit);
            await context.SaveChangesAsync();

            await context.SymptomIntakes.AddAsync(new SymptomIntake
            {
                TenantId = 1,
                VisitId = visit.Id,
                FreeTextComplaint = "Chest pain and shortness of breath",
                SelectedSymptoms = "[\"Chest pain\",\"Shortness of breath\"]",
                ExtractedPrimarySymptoms = "[\"Chest pain\"]",
                ExtractionSource = PatientIntakeConstants.ExtractionSourceDeterministicFallback,
                SubjectiveSummary = "Patient reported chest pain during intake.",
                SubmittedAt = visitDate.AddMinutes(5)
            });

            var triage = new TriageAssessment
            {
                TenantId = 1,
                VisitId = visit.Id,
                UrgencyLevel = "Priority",
                PriorityScore = 72m,
                Explanation = "Priority based on chest pain presentation.",
                QueueMessage = "Clinician review needed.",
                PositionPending = false,
                LastQueueUpdatedAt = visitDate.AddMinutes(10),
                AssessedAt = visitDate.AddMinutes(10)
            };
            await context.TriageAssessments.AddAsync(triage);
            await context.SaveChangesAsync();

            var queueTicket = new QueueTicket
            {
                TenantId = 1,
                FacilityId = facilityId,
                VisitId = visit.Id,
                TriageAssessmentId = triage.Id,
                QueueDate = visitDate.Date,
                QueueNumber = queueNumber,
                QueueStatus = PatientIntakeConstants.QueueStatusCompleted,
                CurrentStage = "Completed",
                IsActive = false,
                EnteredQueueAt = visitDate.AddMinutes(11),
                CalledAt = visitDate.AddMinutes(20),
                ConsultationStartedAt = visitDate.AddMinutes(25),
                ConsultationStartedByClinicianUserId = clinicianUserId,
                CompletedAt = visitDate.AddMinutes(45),
                LastStatusChangedAt = visitDate.AddMinutes(45),
                CurrentClinicianUserId = clinicianUserId
            };
            await context.QueueTickets.AddAsync(queueTicket);
            await context.SaveChangesAsync();

            await context.QueueEvents.AddAsync(new QueueEvent
            {
                TenantId = 1,
                QueueTicketId = queueTicket.Id,
                EventType = PatientIntakeConstants.QueueEventStatusChanged,
                OldStatus = PatientIntakeConstants.QueueStatusInConsultation,
                NewStatus = PatientIntakeConstants.QueueStatusCompleted,
                ChangedByClinicianUserId = clinicianUserId,
                Notes = "Consultation completed.",
                EventAt = visitDate.AddMinutes(45)
            });

            await context.VitalSignsRecords.AddAsync(new VitalSigns
            {
                TenantId = 1,
                VisitId = visit.Id,
                RecordedByClinicianUserId = clinicianUserId,
                Phase = PatientIntakeConstants.VitalSignsPhaseConsultation,
                IsLatest = true,
                HeartRate = 102,
                OxygenSaturation = 95,
                RecordedAt = visitDate.AddMinutes(30)
            });

            await context.EncounterNotes.AddAsync(new EncounterNote
            {
                TenantId = 1,
                VisitId = visit.Id,
                CreatedByClinicianUserId = clinicianUserId,
                IntakeSubjective = "Intake subjective text.",
                Subjective = "Subjective note.",
                Objective = "Objective findings.",
                Assessment = includeFallbackOnly ? "Likely musculoskeletal chest pain." : "Assessment complete.",
                Plan = includeFallbackOnly ? "Follow-up and warning signs advised." : "Plan complete.",
                ClinicianTimelineSummary = includeFallbackOnly ? string.Empty : clinicianTimelineSummary,
                PatientTimelineSummary = includeFallbackOnly ? string.Empty : patientTimelineSummary,
                Status = PatientIntakeConstants.EncounterNoteStatusFinalized,
                FinalizedAt = visitDate.AddMinutes(44)
            });

            await context.SaveChangesAsync();
            return visit.Id;
        });
    }
}
