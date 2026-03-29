using MedStream.PatientIntake.Pathways;
using Shouldly;
using System.Threading.Tasks;
using Xunit;

namespace MedStream.Tests.PatientIntake;

public class ApcFallbackServices_Tests : MedStreamTestBase
{
    private readonly IApcCatalogProvider _catalogProvider;
    private readonly IApcSummaryProvider _summaryProvider;
    private readonly IApcFallbackRoutingService _routingService;
    private readonly IApcFallbackQuestionService _questionService;

    public ApcFallbackServices_Tests()
    {
        _catalogProvider = Resolve<IApcCatalogProvider>();
        _summaryProvider = Resolve<IApcSummaryProvider>();
        _routingService = Resolve<IApcFallbackRoutingService>();
        _questionService = Resolve<IApcFallbackQuestionService>();
    }

    [Fact]
    public void CatalogProvider_Should_Load_Entry_Sections()
    {
        var sections = _catalogProvider.GetAllSections();
        sections.Count.ShouldBeGreaterThan(0);
        sections.ShouldContain(item => item.Id == "cough_or_difficulty_breathing");
    }

    [Fact]
    public void RoutingService_Should_Select_Relevant_Summaries_For_Complaint()
    {
        var context = _routingService.Resolve(
            "I have chest pain and shortness of breath",
            new[] { "Chest Pain" },
            new[] { "Chest Pain", "Difficulty Breathing" });

        context.SummaryIds.Count.ShouldBeGreaterThan(0);
        context.SectionIds.Count.ShouldBeGreaterThan(0);
    }

    [Fact]
    public async Task QuestionService_Should_Return_Deterministic_Fallback_Questions_When_Ai_Unavailable()
    {
        var questions = await _questionService.GenerateQuestionsAsync(
            "I have dizziness and feel weak",
            new[] { "Dizziness" },
            new[] { "Dizziness" },
            new[] { "dizziness" });

        questions.Count.ShouldBeGreaterThan(0);
        questions[0].QuestionText.ShouldNotBeNullOrWhiteSpace();
    }

    [Fact]
    public void SummaryProvider_Should_Load_Apc_Summaries()
    {
        var summaries = _summaryProvider.GetAllSummaries();
        summaries.Count.ShouldBeGreaterThan(0);
        summaries.ShouldContain(item => item.Id == "chest_pain");
    }
}
