using MedStream.Authorization.Accounts;
using MedStream.Authorization.Accounts.Dto;
using MedStream.PatientIntake;
using MedStream.PatientIntake.Dto;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace MedStream.Tests.PatientIntake;

public class PatientIntakeAppService_Tests : MedStreamTestBase
{
    private readonly IAccountAppService _accountAppService;
    private readonly IPatientIntakeAppService _patientIntakeAppService;

    public PatientIntakeAppService_Tests()
    {
        _accountAppService = Resolve<IAccountAppService>();
        _patientIntakeAppService = Resolve<IPatientIntakeAppService>();
    }

    [Fact]
    public async Task CheckIn_Should_Create_Visit_For_Current_Patient()
    {
        var patientEmail = await RegisterAndLoginPatientAsync();

        var result = await _patientIntakeAppService.CheckIn();

        result.VisitId.ShouldBeGreaterThan(0);
        result.PathwayKey.ShouldBe(PatientIntakeConstants.UnassignedPathwayKey);

        await UsingDbContextAsync(async context =>
        {
            var visit = await context.Set<Visit>().FirstOrDefaultAsync(item => item.Id == result.VisitId);
            visit.ShouldNotBeNull();
            visit.PathwayKey.ShouldBe(PatientIntakeConstants.UnassignedPathwayKey);
            visit.Status.ShouldBe(PatientIntakeConstants.VisitStatusIntakeInProgress);
        });

        patientEmail.ShouldNotBeNull();
    }

    [Fact]
    public async Task ExtractSymptoms_Should_Use_Deterministic_Fallback_When_OpenAi_Is_Not_Configured()
    {
        await RegisterAndLoginPatientAsync();
        var checkIn = await _patientIntakeAppService.CheckIn();

        var extraction = await _patientIntakeAppService.ExtractSymptoms(new ExtractSymptomsInput
        {
            VisitId = checkIn.VisitId,
            FreeText = "I have cough and shortness of breath for three days",
            SelectedSymptoms = new List<string>()
        });

        extraction.ExtractionSource.ShouldBe(PatientIntakeConstants.ExtractionSourceDeterministicFallback);
        extraction.ExtractedPrimarySymptoms.ShouldContain("Cough");
        extraction.ExtractedPrimarySymptoms.ShouldContain("Difficulty Breathing");
        extraction.SelectedPathwayKey.ShouldNotBeNullOrWhiteSpace();
        extraction.SelectedPathwayKey.ShouldNotBe(PatientIntakeConstants.UnassignedPathwayKey);
        extraction.IntakeMode.ShouldBe(PatientIntakeConstants.IntakeModeApprovedJson);
    }

    [Fact]
    public async Task ExtractSymptoms_Should_Select_ApcFallback_Mode_When_No_Strong_Pathway_Match()
    {
        await RegisterAndLoginPatientAsync();
        var checkIn = await _patientIntakeAppService.CheckIn();

        var extraction = await _patientIntakeAppService.ExtractSymptoms(new ExtractSymptomsInput
        {
            VisitId = checkIn.VisitId,
            FreeText = "qwerty asdfg lorem ipsum weird symptom text",
            SelectedSymptoms = new List<string>()
        });

        extraction.IntakeMode.ShouldBe(PatientIntakeConstants.IntakeModeApcFallback);
        extraction.SelectedPathwayKey.ShouldBe(PatientIntakeConstants.GeneralFallbackPathwayKey);
        extraction.FallbackSummaryIds.Count.ShouldBeGreaterThan(0);
    }

    [Fact]
    public async Task UrgentCheck_Should_FastTrack_When_Global_Urgent_Answer_Is_True()
    {
        await RegisterAndLoginPatientAsync();
        var checkIn = await _patientIntakeAppService.CheckIn();

        var urgentCheck = await _patientIntakeAppService.UrgentCheck(new UrgentCheckInput
        {
            VisitId = checkIn.VisitId,
            PathwayKey = "cough_or_difficulty_breathing",
            IntakeMode = PatientIntakeConstants.IntakeModeApprovedJson,
            FreeText = "I am feeling unwell",
            ExtractedPrimarySymptoms = new List<string> { "Cough" },
            Answers = new Dictionary<string, object>
            {
                { "urgentSevereBreathing", true },
                { "urgentSevereChestPain", false },
                { "urgentUncontrolledBleeding", false },
                { "urgentCollapse", false },
                { "urgentConfusion", false }
            }
        });

        urgentCheck.IsUrgent.ShouldBeTrue();
        urgentCheck.ShouldFastTrack.ShouldBeTrue();
        urgentCheck.QuestionSet.Count.ShouldBeGreaterThan(0);
    }

    [Fact]
    public async Task GetQuestions_Should_Prioritize_Breathing_Question_For_Respiratory_Symptom()
    {
        await RegisterAndLoginPatientAsync();

        var output = await _patientIntakeAppService.GetQuestions(new GetIntakeQuestionsInput
        {
            PathwayKey = "cough_or_difficulty_breathing",
            PrimarySymptom = "Cough"
        });

        output.QuestionSet.Count.ShouldBeGreaterThan(0);
        output.QuestionSet.ShouldContain(item => item.QuestionKey == "coughDurationWeeks");
    }

    [Fact]
    public async Task AssessTriage_Should_Save_Triage_Assessment_And_Update_Visit_Status()
    {
        await RegisterAndLoginPatientAsync();
        var checkIn = await _patientIntakeAppService.CheckIn();
        await _patientIntakeAppService.ExtractSymptoms(new ExtractSymptomsInput
        {
            VisitId = checkIn.VisitId,
            FreeText = "I have cough and fever for four days",
            SelectedSymptoms = new List<string> { "Cough", "Fever" }
        });

        var output = await _patientIntakeAppService.AssessTriage(new AssessTriageInput
        {
            VisitId = checkIn.VisitId,
            FreeText = "cough and fever",
            SelectedSymptoms = new List<string> { "Cough", "Fever" },
            ExtractedPrimarySymptoms = new List<string> { "Cough", "Fever" },
            Answers = new Dictionary<string, object>
            {
                { "durationDays", 4 },
                { "hasFever", true },
                { "temperatureBand", "38-39" },
                { "breathingDifficulty", false },
                { "chestPain", false },
                { "dangerSymptoms", new List<object> { "none" } },
                { "chronicCondition", false }
            }
        });

        output.Triage.ShouldNotBeNull();
        output.Queue.ShouldNotBeNull();
        output.Queue.PositionPending.ShouldBeFalse();
        output.Queue.QueueNumber.ShouldBeGreaterThan(0);
        output.Queue.QueueStatus.ShouldBe(PatientIntakeConstants.QueueStatusWaiting);
        output.Execution.TriggeredOutcomeIds.ShouldBeEmpty();
        output.Execution.TriggeredRecommendationIds.ShouldBeEmpty();
        output.Execution.RuleTrace.ShouldBeEmpty();

        await UsingDbContextAsync(async context =>
        {
            var triage = await context.Set<TriageAssessment>().FirstOrDefaultAsync(item => item.VisitId == checkIn.VisitId);
            triage.ShouldNotBeNull();
            triage.PositionPending.ShouldBeFalse();
            triage.QueueMessage.ShouldContain("#");

            var intake = await context.Set<SymptomIntake>().FirstOrDefaultAsync(item => item.VisitId == checkIn.VisitId);
            intake.ShouldNotBeNull();
            intake.FollowUpAnswersJson.ShouldNotBeNullOrWhiteSpace();
            intake.SubjectiveSummary.ShouldNotBeNullOrWhiteSpace();
            intake.SubjectiveSummary.ShouldContain("Chief complaint");
            intake.SubjectiveSummary.ShouldContain("Follow-up answers");

            var queueTicket = await context.Set<QueueTicket>().FirstOrDefaultAsync(item => item.VisitId == checkIn.VisitId && item.IsActive);
            queueTicket.ShouldNotBeNull();
            queueTicket.QueueNumber.ShouldBeGreaterThan(0);
            queueTicket.QueueStatus.ShouldBe(PatientIntakeConstants.QueueStatusWaiting);

            var queueEvents = await context.Set<QueueEvent>().Where(item => item.QueueTicketId == queueTicket.Id).ToListAsync();
            queueEvents.Count.ShouldBe(1);
            queueEvents[0].EventType.ShouldBe(PatientIntakeConstants.QueueEventEntered);

            var visit = await context.Set<Visit>().FirstAsync(item => item.Id == checkIn.VisitId);
            visit.Status.ShouldBe(PatientIntakeConstants.VisitStatusQueued);
        });
    }

    [Fact]
    public async Task AssessTriage_Should_Not_Create_Duplicate_Active_QueueTicket_For_Same_Visit()
    {
        await RegisterAndLoginPatientAsync();
        var checkIn = await _patientIntakeAppService.CheckIn();
        await _patientIntakeAppService.ExtractSymptoms(new ExtractSymptomsInput
        {
            VisitId = checkIn.VisitId,
            FreeText = "I have persistent cough",
            SelectedSymptoms = new List<string> { "Cough" }
        });

        var request = new AssessTriageInput
        {
            VisitId = checkIn.VisitId,
            FreeText = "persistent cough",
            SelectedSymptoms = new List<string> { "Cough" },
            ExtractedPrimarySymptoms = new List<string> { "Cough" },
            Answers = new Dictionary<string, object>
            {
                { "durationDays", 3 },
                { "hasFever", false },
                { "breathingDifficulty", false }
            }
        };

        await _patientIntakeAppService.AssessTriage(request);
        await _patientIntakeAppService.AssessTriage(request);

        await UsingDbContextAsync(async context =>
        {
            var activeTickets = await context.Set<QueueTicket>()
                .Where(item => item.VisitId == checkIn.VisitId && item.IsActive && !item.IsDeleted)
                .ToListAsync();
            activeTickets.Count.ShouldBe(1);
        });
    }

    [Fact]
    public async Task AssessTriage_Should_Supersede_Previous_Active_QueueTicket_For_Same_Patient()
    {
        await RegisterAndLoginPatientAsync();

        var firstVisit = await _patientIntakeAppService.CheckIn();
        await _patientIntakeAppService.ExtractSymptoms(new ExtractSymptomsInput
        {
            VisitId = firstVisit.VisitId,
            FreeText = "I have persistent cough",
            SelectedSymptoms = new List<string> { "Cough" }
        });
        await _patientIntakeAppService.AssessTriage(new AssessTriageInput
        {
            VisitId = firstVisit.VisitId,
            FreeText = "persistent cough",
            SelectedSymptoms = new List<string> { "Cough" },
            ExtractedPrimarySymptoms = new List<string> { "Cough" },
            Answers = new Dictionary<string, object>
            {
                { "durationDays", 3 },
                { "hasFever", false },
                { "breathingDifficulty", false }
            }
        });

        var secondVisit = await _patientIntakeAppService.CheckIn();
        await _patientIntakeAppService.ExtractSymptoms(new ExtractSymptomsInput
        {
            VisitId = secondVisit.VisitId,
            FreeText = "I have chest pain",
            SelectedSymptoms = new List<string> { "Chest Pain" }
        });
        await _patientIntakeAppService.AssessTriage(new AssessTriageInput
        {
            VisitId = secondVisit.VisitId,
            FreeText = "chest pain",
            SelectedSymptoms = new List<string> { "Chest Pain" },
            ExtractedPrimarySymptoms = new List<string> { "Chest Pain" },
            Answers = new Dictionary<string, object>
            {
                { "durationDays", 1 },
                { "urgentSevereChestPain", true },
                { "urgentSevereBreathing", false }
            }
        });

        await UsingDbContextAsync(async context =>
        {
            var activeTickets = await context.Set<QueueTicket>()
                .Where(item => item.IsActive && !item.IsDeleted)
                .ToListAsync();
            activeTickets.Count.ShouldBe(1);
            activeTickets[0].VisitId.ShouldBe(secondVisit.VisitId);

            var firstVisitTicket = await context.Set<QueueTicket>().SingleAsync(item => item.VisitId == firstVisit.VisitId);
            firstVisitTicket.QueueStatus.ShouldBe(PatientIntakeConstants.QueueStatusCancelled);
            firstVisitTicket.IsActive.ShouldBeFalse();

            var supersedeEvent = await context.Set<QueueEvent>()
                .Where(item => item.QueueTicketId == firstVisitTicket.Id)
                .OrderByDescending(item => item.Id)
                .FirstAsync();
            supersedeEvent.NewStatus.ShouldBe(PatientIntakeConstants.QueueStatusCancelled);
            supersedeEvent.Notes.ToLowerInvariant().ShouldContain("superseded by new visit");
        });
    }

    private async Task<string> RegisterAndLoginPatientAsync()
    {
        var email = $"patient-intake-{Guid.NewGuid():N}@medstream.test";
        await _accountAppService.Register(new RegisterInput
        {
            FirstName = "Patient",
            LastName = "Intake",
            EmailAddress = email,
            PhoneNumber = "0634113456",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Patient"
        });

        LoginAsTenant("Default", email);
        return email;
    }
}
