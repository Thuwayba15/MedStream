using Abp.Authorization;
using Abp.MultiTenancy;
using Abp.UI;
using MedStream.Authorization.Accounts;
using MedStream.Authorization.Accounts.Dto;
using MedStream.Consultation;
using MedStream.Consultation.Dto;
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

namespace MedStream.Tests.Consultation;

public class ConsultationAppService_Tests : MedStreamTestBase
{
    private readonly IAccountAppService _accountAppService;
    private readonly IUserAppService _userAppService;
    private readonly IFacilityAppService _facilityAppService;
    private readonly IPatientIntakeAppService _patientIntakeAppService;
    private readonly IQueueOperationsAppService _queueOperationsAppService;
    private readonly IConsultationAppService _consultationAppService;

    public ConsultationAppService_Tests()
    {
        _accountAppService = Resolve<IAccountAppService>();
        _userAppService = Resolve<IUserAppService>();
        _facilityAppService = Resolve<IFacilityAppService>();
        _patientIntakeAppService = Resolve<IPatientIntakeAppService>();
        _queueOperationsAppService = Resolve<IQueueOperationsAppService>();
        _consultationAppService = Resolve<IConsultationAppService>();
    }

    [Fact]
    public async Task GetConsultationWorkspace_Should_Seed_EncounterNote_From_Intake()
    {
        var scenario = await PrepareConsultationScenarioAsync();

        var workspace = await _consultationAppService.GetConsultationWorkspace(new GetConsultationWorkspaceInput
        {
            VisitId = scenario.VisitId,
            QueueTicketId = scenario.QueueTicketId
        });

        workspace.VisitId.ShouldBe(scenario.VisitId);
        workspace.QueueTicketId.ShouldBe(scenario.QueueTicketId);
        workspace.PatientContext.UrgencyLevel.ShouldNotBeNullOrWhiteSpace();
        workspace.EncounterNote.IntakeSubjective.ShouldNotBeNullOrWhiteSpace();
        workspace.EncounterNote.Subjective.ShouldBe(workspace.EncounterNote.IntakeSubjective);
        workspace.EncounterNote.Status.ShouldBe(PatientIntakeConstants.EncounterNoteStatusDraft);
    }

    [Fact]
    public async Task SaveVitals_Should_Replace_Previous_Latest_Record()
    {
        var scenario = await PrepareConsultationScenarioAsync();

        var firstVitals = await _consultationAppService.SaveVitals(new SaveVitalsInput
        {
            VisitId = scenario.VisitId,
            Phase = PatientIntakeConstants.VitalSignsPhaseConsultation,
            HeartRate = 95,
            OxygenSaturation = 97
        });
        var secondVitals = await _consultationAppService.SaveVitals(new SaveVitalsInput
        {
            VisitId = scenario.VisitId,
            Phase = PatientIntakeConstants.VitalSignsPhaseConsultation,
            HeartRate = 110,
            OxygenSaturation = 94
        });

        firstVitals.IsLatest.ShouldBeTrue();
        secondVitals.IsLatest.ShouldBeTrue();

        await UsingDbContextAsync(async context =>
        {
            var vitals = await context.VitalSignsRecords
                .Where(item => item.VisitId == scenario.VisitId)
                .OrderBy(item => item.Id)
                .ToListAsync();

            vitals.Count.ShouldBe(2);
            vitals[0].IsLatest.ShouldBeFalse();
            vitals[1].IsLatest.ShouldBeTrue();
            vitals[1].HeartRate.ShouldBe(110);
        });
    }

    [Fact]
    public async Task GenerateSubjectiveDraft_Should_Use_Transcript_Context_Without_Overwriting_Note()
    {
        var scenario = await PrepareConsultationScenarioAsync();
        var workspace = await _consultationAppService.GetConsultationWorkspace(new GetConsultationWorkspaceInput
        {
            VisitId = scenario.VisitId,
            QueueTicketId = scenario.QueueTicketId
        });

        await _consultationAppService.AttachConsultationTranscript(new AttachConsultationTranscriptInput
        {
            VisitId = scenario.VisitId,
            InputMode = PatientIntakeConstants.TranscriptInputModeTyped,
            RawTranscriptText = "Patient says the chest pain has improved but dizziness started after arrival."
        });

        var draft = await _consultationAppService.GenerateSubjectiveDraft(new GenerateConsultationDraftInput
        {
            VisitId = scenario.VisitId
        });

        draft.Subjective.ShouldNotBeNullOrWhiteSpace();
        draft.Subjective.ShouldContain("dizziness");

        await UsingDbContextAsync(async context =>
        {
            var note = await context.EncounterNotes.SingleAsync(item => item.VisitId == scenario.VisitId);
            note.Subjective.ShouldBe(workspace.EncounterNote.Subjective);
        });
    }

    [Fact]
    public async Task FinalizeEncounterNote_Should_Require_Complete_Soap()
    {
        var scenario = await PrepareConsultationScenarioAsync();

        await Should.ThrowAsync<UserFriendlyException>(async () =>
        {
            await _consultationAppService.FinalizeEncounterNote(new FinalizeEncounterNoteInput
            {
                VisitId = scenario.VisitId
            });
        });
    }

    [Fact]
    public async Task UpdateQueueTicketStatus_Should_Require_Finalized_Note_Before_Completion()
    {
        var scenario = await PrepareConsultationScenarioAsync();

        await Should.ThrowAsync<UserFriendlyException>(async () =>
        {
            await _queueOperationsAppService.UpdateQueueTicketStatus(new UpdateQueueTicketStatusInput
            {
                QueueTicketId = scenario.QueueTicketId,
                NewStatus = PatientIntakeConstants.QueueStatusCompleted
            });
        });

        await _consultationAppService.SaveEncounterNoteDraft(new SaveEncounterNoteDraftInput
        {
            VisitId = scenario.VisitId,
            Objective = "Patient alert. Chest wall non-tender. Breath sounds clear. Latest ECG pending.",
            Assessment = "Chest pain under evaluation; symptoms improved after rest.",
            Plan = "Repeat vitals, review ECG, provide clinician-directed treatment, and safety-net if symptoms recur."
        });

        var finalized = await _consultationAppService.FinalizeEncounterNote(new FinalizeEncounterNoteInput
        {
            VisitId = scenario.VisitId
        });
        finalized.Status.ShouldBe(PatientIntakeConstants.EncounterNoteStatusFinalized);

        var completed = await _queueOperationsAppService.UpdateQueueTicketStatus(new UpdateQueueTicketStatusInput
        {
            QueueTicketId = scenario.QueueTicketId,
            NewStatus = PatientIntakeConstants.QueueStatusCompleted
        });

        completed.NewStatus.ShouldBe(PatientIntakeConstants.QueueStatusCompleted);
    }

    [Fact]
    public async Task GetConsultationWorkspace_Should_Block_Other_Clinicians_From_Assigned_Visit()
    {
        var scenario = await PrepareConsultationScenarioAsync();
        var otherClinicianEmail = await RegisterAndApproveClinicianWithFacilityAsync("consultation-other");

        LoginAsTenant(AbpTenantBase.DefaultTenantName, otherClinicianEmail);
        await Should.ThrowAsync<AbpAuthorizationException>(async () =>
        {
            await _consultationAppService.GetConsultationWorkspace(new GetConsultationWorkspaceInput
            {
                VisitId = scenario.VisitId,
                QueueTicketId = scenario.QueueTicketId
            });
        });
    }

    private async Task<ConsultationScenario> PrepareConsultationScenarioAsync()
    {
        var clinicianEmail = await RegisterAndApproveClinicianWithFacilityAsync("consultation-clinician");
        var triageResult = await CreateQueuedVisitForPatientAsync($"consultation-patient-{Guid.NewGuid():N}@medstream.test", isUrgent: true);

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

        return new ConsultationScenario
        {
            ClinicianEmail = clinicianEmail,
            VisitId = await UsingDbContextAsync(async context =>
                await context.QueueTickets
                    .Where(item => item.Id == triageResult.Queue.QueueTicketId)
                    .Select(item => item.VisitId)
                    .SingleAsync()),
            QueueTicketId = triageResult.Queue.QueueTicketId
        };
    }

    private async Task<string> RegisterAndApproveClinicianWithFacilityAsync(string prefix)
    {
        var clinicianEmail = $"{prefix}-{Guid.NewGuid():N}@medstream.test";
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Consultation",
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
            DecisionReason = "Approved for consultation test."
        });

        var facilityId = await UsingDbContextAsync(async context =>
            await context.Facilities
                .Where(item => item.TenantId == MultiTenancyConsts.DefaultTenantId && item.IsActive)
                .Select(item => item.Id)
                .FirstAsync());
        await _facilityAppService.AssignClinician(new AssignClinicianFacilityInput
        {
            ClinicianUserId = clinicianUserId,
            FacilityId = facilityId
        });

        return clinicianEmail;
    }

    private async Task<AssessTriageOutput> CreateQueuedVisitForPatientAsync(string patientEmail, bool isUrgent)
    {
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Consultation",
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

    private sealed class ConsultationScenario
    {
        public string ClinicianEmail { get; set; } = string.Empty;

        public long VisitId { get; set; }

        public long QueueTicketId { get; set; }
    }
}
