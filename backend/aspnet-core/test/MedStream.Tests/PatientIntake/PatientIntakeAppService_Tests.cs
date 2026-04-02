using MedStream.Authorization.Accounts;
using MedStream.Authorization.Accounts.Dto;
using MedStream.Facilities;
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
        var facilityId = await GetActiveFacilityIdAsync();

        var result = await _patientIntakeAppService.CheckIn(new PatientCheckInInput
        {
            SelectedFacilityId = facilityId
        });

        result.VisitId.ShouldBeGreaterThan(0);
        result.FacilityId.ShouldBe(facilityId);
        result.PathwayKey.ShouldBe(PatientIntakeConstants.UnassignedPathwayKey);

        await UsingDbContextAsync(async context =>
        {
            var visit = await context.Set<Visit>().FirstOrDefaultAsync(item => item.Id == result.VisitId);
            visit.ShouldNotBeNull();
            visit.FacilityId.ShouldBe(facilityId);
            visit.PathwayKey.ShouldBe(PatientIntakeConstants.UnassignedPathwayKey);
            visit.Status.ShouldBe(PatientIntakeConstants.VisitStatusIntakeInProgress);
        });

        patientEmail.ShouldNotBeNull();
    }

    [Fact]
    public async Task ExtractSymptoms_Should_Use_Deterministic_Fallback_When_OpenAi_Is_Not_Configured()
    {
        await RegisterAndLoginPatientAsync();
        var checkIn = await CheckInAsync();

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
        extraction.FollowUpPlans.Count.ShouldBeGreaterThan(0);
        extraction.FollowUpPlans[0].PathwayKey.ShouldBe("cough_or_difficulty_breathing");
    }

    [Fact]
    public async Task ExtractSymptoms_Should_Select_ApcFallback_Mode_When_No_Strong_Pathway_Match()
    {
        await RegisterAndLoginPatientAsync();
        var checkIn = await CheckInAsync();

        var extraction = await _patientIntakeAppService.ExtractSymptoms(new ExtractSymptomsInput
        {
            VisitId = checkIn.VisitId,
            FreeText = "qwerty asdfg lorem ipsum weird symptom text",
            SelectedSymptoms = new List<string>()
        });

        extraction.IntakeMode.ShouldBe(PatientIntakeConstants.IntakeModeApcFallback);
        extraction.SelectedPathwayKey.ShouldBe(PatientIntakeConstants.GeneralFallbackPathwayKey);
        extraction.FallbackSummaryIds.Count.ShouldBeGreaterThan(0);
        extraction.FollowUpPlans.Count.ShouldBe(1);
        extraction.FollowUpPlans[0].IntakeMode.ShouldBe(PatientIntakeConstants.IntakeModeApcFallback);
    }

    [Fact]
    public async Task UrgentCheck_Should_FastTrack_When_Global_Urgent_Answer_Is_True()
    {
        await RegisterAndLoginPatientAsync();
        var checkIn = await CheckInAsync();

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
        var checkIn = await CheckInAsync();
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
            intake.SubjectiveSummary.ShouldContain("Key details");
            intake.SubjectiveSummary.ShouldNotContain("urgentSevereBreathing");

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
    public async Task AssessTriage_Should_Use_Highest_Risk_Approved_FollowUp_Pathway()
    {
        await RegisterAndLoginPatientAsync();
        var checkIn = await CheckInAsync();
        await _patientIntakeAppService.ExtractSymptoms(new ExtractSymptomsInput
        {
            VisitId = checkIn.VisitId,
            FreeText = "I have a cough and I injured my arm",
            SelectedSymptoms = new List<string> { "Cough", "Injury" }
        });

        var output = await _patientIntakeAppService.AssessTriage(new AssessTriageInput
        {
            VisitId = checkIn.VisitId,
            FreeText = "cough and arm injury",
            SelectedSymptoms = new List<string> { "Cough", "Injury" },
            ExtractedPrimarySymptoms = new List<string> { "Cough", "Injury" },
            FollowUpPlans = new List<AssessTriageFollowUpPlanInput>
            {
                new()
                {
                    PathwayKey = "cough_or_difficulty_breathing",
                    PrimarySymptom = "Cough",
                    IntakeMode = PatientIntakeConstants.IntakeModeApprovedJson
                },
                new()
                {
                    PathwayKey = "hand_or_upper_limb_injury",
                    PrimarySymptom = "Injury",
                    IntakeMode = PatientIntakeConstants.IntakeModeApprovedJson
                }
            },
            Answers = new Dictionary<string, object>
            {
                { "coughDurationWeeks", 1 },
                { "hasDifficultyBreathing", false },
                { "hasChestPain", false },
                { "injuryFromFall", true },
                { "visibleDeformity", true },
                { "cannotMoveFingers", "no" }
            }
        });

        output.Triage.UrgencyLevel.ShouldBe("Urgent");
        output.Triage.RedFlags.ShouldContain("possible_fracture");
        output.Triage.Explanation.ShouldContain("Highest-risk follow-up pathway");
        output.Execution.TriggeredRedFlags.ShouldContain("possible_fracture");
    }

    [Fact]
    public async Task AssessTriage_Should_Allow_Apc_Fallback_FollowUp_To_Raise_Urgency()
    {
        await RegisterAndLoginPatientAsync();
        var checkIn = await CheckInAsync();
        await _patientIntakeAppService.ExtractSymptoms(new ExtractSymptomsInput
        {
            VisitId = checkIn.VisitId,
            FreeText = "I have a cough and a wound",
            SelectedSymptoms = new List<string> { "Cough" }
        });

        var output = await _patientIntakeAppService.AssessTriage(new AssessTriageInput
        {
            VisitId = checkIn.VisitId,
            FreeText = "cough and bleeding wound",
            SelectedSymptoms = new List<string> { "Cough" },
            ExtractedPrimarySymptoms = new List<string> { "Cough" },
            FollowUpPlans = new List<AssessTriageFollowUpPlanInput>
            {
                new()
                {
                    PathwayKey = "cough_or_difficulty_breathing",
                    PrimarySymptom = "Cough",
                    IntakeMode = PatientIntakeConstants.IntakeModeApprovedJson
                },
                new()
                {
                    PathwayKey = PatientIntakeConstants.GeneralFallbackPathwayKey,
                    PrimarySymptom = "Wound",
                    IntakeMode = PatientIntakeConstants.IntakeModeApcFallback,
                    FallbackSummaryIds = new List<string> { "hand_laceration" }
                }
            },
            FollowUpQuestions = new List<AssessTriageFollowUpQuestionInput>
            {
                new()
                {
                    PlanKey = "apc_wound",
                    PathwayKey = PatientIntakeConstants.GeneralFallbackPathwayKey,
                    IntakeMode = PatientIntakeConstants.IntakeModeApcFallback,
                    QuestionKey = "apc_bleeding",
                    QuestionText = "Do you have heavy bleeding that is not stopping?",
                    InputType = "Boolean"
                }
            },
            Answers = new Dictionary<string, object>
            {
                { "coughDurationWeeks", 1 },
                { "hasDifficultyBreathing", false },
                { "hasChestPain", false },
                { "apc_bleeding", true }
            }
        });

        output.Triage.UrgencyLevel.ShouldBe("Urgent");
        output.Triage.RedFlags.ShouldContain(item => item.StartsWith("apc_", StringComparison.OrdinalIgnoreCase));
        output.Triage.Explanation.ShouldContain("Additional fallback concerns");
    }

    [Fact]
    public async Task AssessTriage_Should_Format_General_Complaint_Summary_Readably()
    {
        await RegisterAndLoginPatientAsync();
        var checkIn = await CheckInAsync();
        await _patientIntakeAppService.ExtractSymptoms(new ExtractSymptomsInput
        {
            VisitId = checkIn.VisitId,
            FreeText = "Dizziness and fatigue",
            SelectedSymptoms = new List<string> { "Dizziness", "Fatigue" }
        });

        await _patientIntakeAppService.AssessTriage(new AssessTriageInput
        {
            VisitId = checkIn.VisitId,
            FreeText = "Dizziness and fatigue",
            SelectedSymptoms = new List<string> { "Dizziness", "Fatigue" },
            ExtractedPrimarySymptoms = new List<string> { "Dizziness", "Fatigue" },
            Answers = new Dictionary<string, object>
            {
                { "Please describe your main concern in one sentence.", "Dizziness and fatigue" },
                { "Select any danger signs now.", new List<object>() },
                { "fainting", true },
                { "DizzinessType", "spinning" },
                { "SymptomOnset", "yesterday" }
            }
        });

        await UsingDbContextAsync(async context =>
        {
            var intake = await context.Set<SymptomIntake>().FirstOrDefaultAsync(item => item.VisitId == checkIn.VisitId);
            intake.ShouldNotBeNull();
            intake.SubjectiveSummary.ShouldNotBeNullOrWhiteSpace();
            intake.SubjectiveSummary.ShouldContain("Symptoms reported: Dizziness, Fatigue");
            intake.SubjectiveSummary.ShouldContain("Main concern: Dizziness and fatigue.");
            intake.SubjectiveSummary.ShouldContain("Fainting.");
            intake.SubjectiveSummary.ShouldContain("Type of dizziness: spinning.");
            intake.SubjectiveSummary.ShouldContain("Symptom onset: yesterday.");
            intake.SubjectiveSummary.ShouldNotContain("[]");
            intake.SubjectiveSummary.ShouldNotContain("Extracted primary symptoms");
        });
    }

    [Fact]
    public async Task AssessTriage_Should_Not_Create_Duplicate_Active_QueueTicket_For_Same_Visit()
    {
        await RegisterAndLoginPatientAsync();
        var checkIn = await CheckInAsync();
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

        var firstVisit = await CheckInAsync();
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

        var secondVisit = await CheckInAsync();
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

    [Fact]
    public async Task GetCurrentQueueStatus_Should_Return_Latest_Status_For_Current_Patient_Visit()
    {
        await RegisterAndLoginPatientAsync();
        var checkIn = await CheckInAsync();
        await _patientIntakeAppService.ExtractSymptoms(new ExtractSymptomsInput
        {
            VisitId = checkIn.VisitId,
            FreeText = "I have persistent cough",
            SelectedSymptoms = new List<string> { "Cough" }
        });

        await _patientIntakeAppService.AssessTriage(new AssessTriageInput
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
        });

        var currentStatus = await _patientIntakeAppService.GetCurrentQueueStatus(new GetCurrentQueueStatusInput
        {
            VisitId = checkIn.VisitId
        });

        currentStatus.Triage.ShouldNotBeNull();
        currentStatus.Queue.ShouldNotBeNull();
        currentStatus.Queue.QueueStatus.ShouldBe(PatientIntakeConstants.QueueStatusWaiting);
        currentStatus.Queue.QueueNumber.ShouldBeGreaterThan(0);
        currentStatus.Queue.Message.ShouldContain("#");
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

    private async Task<PatientCheckInOutput> CheckInAsync()
    {
        var facilityId = await GetActiveFacilityIdAsync();
        return await _patientIntakeAppService.CheckIn(new PatientCheckInInput
        {
            SelectedFacilityId = facilityId
        });
    }

    private async Task<int> GetActiveFacilityIdAsync()
    {
        return await UsingDbContextAsync(async context =>
        {
            var facility = await context.Set<Facility>()
                .Where(item => item.IsActive && !item.IsDeleted)
                .OrderBy(item => item.Id)
                .FirstAsync();
            return facility.Id;
        });
    }
}
