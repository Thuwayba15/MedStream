using MedStream.PatientIntake;
using MedStream.PatientIntake.Dto;
using MedStream.PatientIntake.Pathways;
using MedStream.Authorization.Accounts;
using MedStream.Authorization.Accounts.Dto;
using Shouldly;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace MedStream.Tests.PatientIntake;

public class PathwayExecutionEngine_Tests : MedStreamTestBase
{
    private readonly IPathwayDefinitionProvider _definitionProvider;
    private readonly IPathwayExecutionEngine _executionEngine;
    private readonly IPatientIntakeAppService _patientIntakeAppService;

    public PathwayExecutionEngine_Tests()
    {
        _definitionProvider = Resolve<IPathwayDefinitionProvider>();
        _executionEngine = Resolve<IPathwayExecutionEngine>();
        _patientIntakeAppService = Resolve<IPatientIntakeAppService>();
    }

    [Fact]
    public void Should_Load_Pathway_Definitions_From_Json()
    {
        var legacyPathway = _definitionProvider.GetById("general_adult_fever_cough");
        legacyPathway.ShouldNotBeNull();
        legacyPathway.Inputs.Count.ShouldBeGreaterThan(0);

        var fallbackPathway = _definitionProvider.GetById(PatientIntakeConstants.GeneralFallbackPathwayKey);
        fallbackPathway.ShouldNotBeNull();

        var coughPathway = _definitionProvider.GetById("cough_or_difficulty_breathing");
        coughPathway.ShouldNotBeNull();
        coughPathway.GlobalChecks.Count.ShouldBeGreaterThan(0);
    }

    [Fact]
    public async Task GetQuestions_Should_Match_Legacy_Behavior_For_Default_Pathway()
    {
        await RegisterAndLoginPatientAsync();

        var output = await _patientIntakeAppService.GetQuestions(new GetIntakeQuestionsInput
        {
            PathwayKey = "general_adult_fever_cough",
            PrimarySymptom = "Cough"
        });

        output.QuestionSet.Count.ShouldBe(8);
        output.QuestionSet[0].QuestionKey.ShouldBe("durationDays");
        output.QuestionSet.ShouldContain(item => item.QuestionKey == "temperatureBand" && item.ShowWhenExpression == "answer:hasFever=true");
        output.RuleTrace.Count.ShouldBeGreaterThan(0);
    }

    [Fact]
    public void CoughPathway_Should_Trigger_Link_And_Recommendations()
    {
        var execution = _executionEngine.Execute(new PathwayExecutionRequest
        {
            PathwayId = "cough_or_difficulty_breathing",
            StageId = "clinician_review",
            Audience = "clinician",
            Answers = new Dictionary<string, object>
            {
                { "coughDurationWeeks", 3 },
                { "isSmoker", true },
                { "hasWeightLoss", true },
                { "hasWheezeOrTightChest", true }
            },
            Observations = new Dictionary<string, object>()
        });

        execution.TriggeredOutcomeIds.ShouldContain("lung_cancer_possible");
        execution.TriggeredLinks.ShouldContain(item => item.TargetPathwayId == "wheeze_tight_chest");
        execution.RuleTrace.ShouldContain(item => item.Triggered);
    }

    [Fact]
    public void CoughPathway_UrgentFlag_Should_Not_Return_Zero_PriorityScore()
    {
        var execution = _executionEngine.Execute(new PathwayExecutionRequest
        {
            PathwayId = "cough_or_difficulty_breathing",
            StageId = "clinician_review",
            Audience = "clinician",
            Answers = new Dictionary<string, object>
            {
                { "coughDurationWeeks", 3 },
                { "hasDifficultyBreathing", true }
            },
            Observations = new Dictionary<string, object>()
        });

        execution.TriageIndicators["urgencyLevel"].ShouldBe("Urgent");
        execution.Score.ShouldBeGreaterThan(0);
        execution.TriageIndicators["priorityScore"].ShouldBe("75");
    }

    [Fact]
    public void PatientAudience_Should_Not_Receive_ClinicianOnly_Outputs()
    {
        var execution = _executionEngine.Execute(new PathwayExecutionRequest
        {
            PathwayId = "cough_or_difficulty_breathing",
            StageId = "patient_intake",
            Audience = "patient",
            Answers = new Dictionary<string, object>
            {
                { "hasDifficultyBreathing", true },
                { "isCoughingBlood", true }
            },
            Observations = new Dictionary<string, object>()
        });

        execution.TriggeredOutcomeIds.ShouldBeEmpty();
        execution.TriggeredRecommendationIds.ShouldBeEmpty();
    }

    private async Task RegisterAndLoginPatientAsync()
    {
        var accountService = Resolve<IAccountAppService>();
        var email = $"engine-patient-{System.Guid.NewGuid():N}@medstream.test";
        await accountService.Register(new RegisterInput
        {
            FirstName = "Engine",
            LastName = "Patient",
            EmailAddress = email,
            PhoneNumber = "0634113456",
            Password = "Password1",
            ConfirmPassword = "Password1",
            AccountType = "Patient"
        });

        LoginAsTenant("Default", email);
    }
}
