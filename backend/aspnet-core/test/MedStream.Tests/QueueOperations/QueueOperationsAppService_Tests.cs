using Abp.Application.Services.Dto;
using Abp.Authorization.Users;
using Abp.MultiTenancy;
using MedStream.Authorization.Accounts;
using MedStream.Authorization.Accounts.Dto;
using MedStream.Authorization.Users;
using MedStream.Facilities;
using MedStream.Facilities.Dto;
using MedStream.PatientIntake;
using MedStream.PatientIntake.Dto;
using MedStream.QueueOperations;
using MedStream.QueueOperations.Dto;
using MedStream.Users;
using MedStream.Users.Dto;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace MedStream.Tests.QueueOperations;

public class QueueOperationsAppService_Tests : MedStreamTestBase
{
    private readonly IAccountAppService _accountAppService;
    private readonly IUserAppService _userAppService;
    private readonly IFacilityAppService _facilityAppService;
    private readonly IPatientIntakeAppService _patientIntakeAppService;
    private readonly IQueueOperationsAppService _queueOperationsAppService;

    public QueueOperationsAppService_Tests()
    {
        _accountAppService = Resolve<IAccountAppService>();
        _userAppService = Resolve<IUserAppService>();
        _facilityAppService = Resolve<IFacilityAppService>();
        _patientIntakeAppService = Resolve<IPatientIntakeAppService>();
        _queueOperationsAppService = Resolve<IQueueOperationsAppService>();
    }

    [Fact]
    public async Task GetClinicianQueue_Should_Prioritize_Urgent_Entries()
    {
        var clinicianEmail = await RegisterAndApproveClinicianWithFacilityAsync();

        await CreateQueuedVisitForPatientAsync($"queue-routine-{Guid.NewGuid():N}@medstream.test", isUrgent: false);
        await CreateQueuedVisitForPatientAsync($"queue-urgent-{Guid.NewGuid():N}@medstream.test", isUrgent: true);

        LoginAsTenant(AbpTenantBase.DefaultTenantName, clinicianEmail);
        var result = await _queueOperationsAppService.GetClinicianQueue(new GetClinicianQueueInput
        {
            MaxResultCount = 20
        });

        result.TotalCount.ShouldBe(2);
        result.Items.Count.ShouldBe(2);
        result.Items[0].UrgencyLevel.ShouldBe("Urgent");
        result.Items[0].QueueStatus.ShouldBe(PatientIntakeConstants.QueueStatusWaiting);
    }

    [Fact]
    public async Task GetClinicianQueue_Should_Filter_By_Urgency_And_SearchText()
    {
        var clinicianEmail = await RegisterAndApproveClinicianWithFacilityAsync();

        await CreateQueuedVisitForPatientAsync($"queue-filter-routine-{Guid.NewGuid():N}@medstream.test", isUrgent: false);
        var urgentResult = await CreateQueuedVisitForPatientAsync($"queue-filter-urgent-{Guid.NewGuid():N}@medstream.test", isUrgent: true);

        LoginAsTenant(AbpTenantBase.DefaultTenantName, clinicianEmail);
        var urgentOnly = await _queueOperationsAppService.GetClinicianQueue(new GetClinicianQueueInput
        {
            UrgencyLevels = new List<string> { "Urgent" },
            MaxResultCount = 20
        });

        urgentOnly.TotalCount.ShouldBe(1);
        urgentOnly.Items.Count.ShouldBe(1);
        urgentOnly.Items[0].UrgencyLevel.ShouldBe("Urgent");

        var byQueueNumber = await _queueOperationsAppService.GetClinicianQueue(new GetClinicianQueueInput
        {
            SearchText = urgentResult.Queue.QueueNumber.ToString(),
            MaxResultCount = 20
        });

        byQueueNumber.Items.Any(item => item.QueueNumber == urgentResult.Queue.QueueNumber).ShouldBeTrue();
    }

    [Fact]
    public async Task GetClinicianQueue_Should_Order_By_PriorityScore_Within_Same_Urgency()
    {
        var clinicianEmail = await RegisterAndApproveClinicianWithFacilityAsync();

        var lowerPriority = await CreateQueuedVisitForPatientAsync($"queue-priority-low-{Guid.NewGuid():N}@medstream.test", isUrgent: false);
        var higherPriority = await CreateQueuedVisitForPatientAsync($"queue-priority-high-{Guid.NewGuid():N}@medstream.test", isUrgent: false);

        await UpdatePriorityScoreByQueueTicketIdAsync(lowerPriority.Queue.QueueTicketId, 25m);
        await UpdatePriorityScoreByQueueTicketIdAsync(higherPriority.Queue.QueueTicketId, 80m);

        LoginAsTenant(AbpTenantBase.DefaultTenantName, clinicianEmail);
        var result = await _queueOperationsAppService.GetClinicianQueue(new GetClinicianQueueInput
        {
            UrgencyLevels = new List<string> { "Routine" },
            MaxResultCount = 20
        });

        result.TotalCount.ShouldBe(2);
        result.Items[0].QueueTicketId.ShouldBe(higherPriority.Queue.QueueTicketId);
        result.Items[0].PriorityScore.ShouldBe(80m);
        result.Items[1].QueueTicketId.ShouldBe(lowerPriority.Queue.QueueTicketId);
        result.Items[1].PriorityScore.ShouldBe(25m);
    }

    [Fact]
    public async Task GetQueueTicketForReview_Should_Return_Intake_And_Triage_Context()
    {
        var clinicianEmail = await RegisterAndApproveClinicianWithFacilityAsync();
        var triageResult = await CreateQueuedVisitForPatientAsync($"queue-review-{Guid.NewGuid():N}@medstream.test", isUrgent: true);

        LoginAsTenant(AbpTenantBase.DefaultTenantName, clinicianEmail);
        var review = await _queueOperationsAppService.GetQueueTicketForReview(new GetQueueTicketForReviewInput
        {
            Id = triageResult.Queue.QueueTicketId
        });

        review.QueueTicketId.ShouldBe(triageResult.Queue.QueueTicketId);
        review.VisitId.ShouldBeGreaterThan(0);
        review.PatientUserId.ShouldBeGreaterThan(0);
        review.PatientName.ShouldNotBeNullOrWhiteSpace();
        review.UrgencyLevel.ShouldBe("Urgent");
        review.PriorityScore.ShouldBeGreaterThan(0m);
        review.ChiefComplaint.ShouldNotBeNullOrWhiteSpace();
        review.ConsultationPath.ShouldContain("/clinician/consultation");
        review.PatientHistoryPath.ShouldContain("/clinician/history");
    }

    [Fact]
    public async Task UpdateQueueTicketStatus_Should_Transition_And_Log_Event()
    {
        var clinicianEmail = await RegisterAndApproveClinicianWithFacilityAsync();
        var triageResult = await CreateQueuedVisitForPatientAsync($"queue-status-{Guid.NewGuid():N}@medstream.test", isUrgent: false);

        LoginAsTenant(AbpTenantBase.DefaultTenantName, clinicianEmail);
        var called = await _queueOperationsAppService.UpdateQueueTicketStatus(new UpdateQueueTicketStatusInput
        {
            QueueTicketId = triageResult.Queue.QueueTicketId,
            NewStatus = PatientIntakeConstants.QueueStatusCalled
        });
        var inConsultation = await _queueOperationsAppService.UpdateQueueTicketStatus(new UpdateQueueTicketStatusInput
        {
            QueueTicketId = triageResult.Queue.QueueTicketId,
            NewStatus = PatientIntakeConstants.QueueStatusInConsultation
        });

        called.OldStatus.ShouldBe(PatientIntakeConstants.QueueStatusWaiting);
        called.NewStatus.ShouldBe(PatientIntakeConstants.QueueStatusCalled);
        inConsultation.NewStatus.ShouldBe(PatientIntakeConstants.QueueStatusInConsultation);

        await UsingDbContextAsync(async context =>
        {
            var queueTicket = await context.QueueTickets.SingleAsync(item => item.Id == triageResult.Queue.QueueTicketId);
            queueTicket.QueueStatus.ShouldBe(PatientIntakeConstants.QueueStatusInConsultation);
            queueTicket.ConsultationStartedAt.ShouldNotBeNull();
            queueTicket.ConsultationStartedByClinicianUserId.ShouldNotBeNull();

            var statusEvents = await context.QueueEvents
                .Where(item => item.QueueTicketId == queueTicket.Id)
                .OrderBy(item => item.Id)
                .ToListAsync();

            statusEvents.Count.ShouldBeGreaterThanOrEqualTo(3);
            statusEvents.Any(item => item.NewStatus == PatientIntakeConstants.QueueStatusCalled).ShouldBeTrue();
            statusEvents.Any(item => item.NewStatus == PatientIntakeConstants.QueueStatusInConsultation).ShouldBeTrue();
        });
    }

    [Fact]
    public async Task UpdateQueueTicketStatus_Should_Reject_Invalid_Transition()
    {
        var clinicianEmail = await RegisterAndApproveClinicianWithFacilityAsync();
        var triageResult = await CreateQueuedVisitForPatientAsync($"queue-invalid-transition-{Guid.NewGuid():N}@medstream.test", isUrgent: false);

        LoginAsTenant(AbpTenantBase.DefaultTenantName, clinicianEmail);
        await _queueOperationsAppService.UpdateQueueTicketStatus(new UpdateQueueTicketStatusInput
        {
            QueueTicketId = triageResult.Queue.QueueTicketId,
            NewStatus = PatientIntakeConstants.QueueStatusCalled
        });
        await _queueOperationsAppService.UpdateQueueTicketStatus(new UpdateQueueTicketStatusInput
        {
            QueueTicketId = triageResult.Queue.QueueTicketId,
            NewStatus = PatientIntakeConstants.QueueStatusInConsultation
        });
        await _queueOperationsAppService.UpdateQueueTicketStatus(new UpdateQueueTicketStatusInput
        {
            QueueTicketId = triageResult.Queue.QueueTicketId,
            NewStatus = PatientIntakeConstants.QueueStatusCompleted
        });

        await Should.ThrowAsync<Abp.UI.UserFriendlyException>(async () =>
        {
            await _queueOperationsAppService.UpdateQueueTicketStatus(new UpdateQueueTicketStatusInput
            {
                QueueTicketId = triageResult.Queue.QueueTicketId,
                NewStatus = PatientIntakeConstants.QueueStatusWaiting
            });
        });
    }

    private async Task<string> RegisterAndApproveClinicianWithFacilityAsync()
    {
        var clinicianEmail = $"queue-clinician-{Guid.NewGuid():N}@medstream.test";
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Queue",
            LastName = "Clinician",
            EmailAddress = clinicianEmail,
            PhoneNumber = "0820000000",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Clinician",
            IdNumber = "9001015009087",
            ProfessionType = "Doctor",
            RegulatoryBody = "HPCSA",
            RegistrationNumber = $"HPCSA-{Guid.NewGuid():N}".Substring(0, 18),
            RequestedFacilityId = 1
        });

        LoginAsDefaultTenantAdmin();
        var clinicianUserId = await UsingDbContextAsync(async context =>
            await context.Users
                .Where(item => item.EmailAddress == clinicianEmail)
                .Select(item => item.Id)
                .SingleAsync());
        await _userAppService.ApproveClinician(new ClinicianApprovalDecisionInput
        {
            Id = clinicianUserId,
            DecisionReason = "Approved for clinician queue test."
        });

        var checkInFacilityId = await UsingDbContextAsync(async context =>
            await context.Facilities
                .Where(item => item.TenantId == MultiTenancyConsts.DefaultTenantId && item.IsActive)
                .Select(item => item.Id)
                .FirstOrDefaultAsync());
        checkInFacilityId.ShouldBeGreaterThan(0);
        await _facilityAppService.AssignClinician(new AssignClinicianFacilityInput
        {
            ClinicianUserId = clinicianUserId,
            FacilityId = checkInFacilityId
        });

        return clinicianEmail;
    }

    private async Task<AssessTriageOutput> CreateQueuedVisitForPatientAsync(string patientEmail, bool isUrgent)
    {
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Queue",
            LastName = isUrgent ? "UrgentPatient" : "RoutinePatient",
            EmailAddress = patientEmail,
            PhoneNumber = "0810000000",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Patient"
        });

        LoginAsTenant(AbpTenantBase.DefaultTenantName, patientEmail);
        var checkIn = await _patientIntakeAppService.CheckIn();
        await _patientIntakeAppService.ExtractSymptoms(new ExtractSymptomsInput
        {
            VisitId = checkIn.VisitId,
            FreeText = isUrgent ? "Severe chest pain and shortness of breath" : "Dry cough and mild fever",
            SelectedSymptoms = isUrgent
                ? new List<string> { "Chest Pain", "Difficulty Breathing" }
                : new List<string> { "Cough", "Fever" }
        });

        return await _patientIntakeAppService.AssessTriage(new AssessTriageInput
        {
            VisitId = checkIn.VisitId,
            FreeText = isUrgent ? "Severe chest pain and shortness of breath" : "Dry cough and mild fever",
            SelectedSymptoms = isUrgent
                ? new List<string> { "Chest Pain", "Difficulty Breathing" }
                : new List<string> { "Cough", "Fever" },
            ExtractedPrimarySymptoms = isUrgent
                ? new List<string> { "Chest Pain", "Difficulty Breathing" }
                : new List<string> { "Cough", "Fever" },
            Answers = new Dictionary<string, object>
            {
                { "durationDays", isUrgent ? 1 : 3 },
                { "hasFever", !isUrgent },
                { "urgentSevereChestPain", isUrgent },
                { "urgentSevereBreathing", isUrgent }
            }
        });
    }

    private async Task UpdatePriorityScoreByQueueTicketIdAsync(long queueTicketId, decimal priorityScore)
    {
        await UsingDbContextAsync(async context =>
        {
            var queueTicket = await context.QueueTickets.SingleAsync(item => item.Id == queueTicketId);
            var triageAssessment = await context.TriageAssessments.SingleAsync(item => item.Id == queueTicket.TriageAssessmentId);
            triageAssessment.PriorityScore = priorityScore;
            await context.SaveChangesAsync();
        });
    }
}
