using MedStream.PatientIntake;
using MedStream.PatientIntake.Pathways;
using Shouldly;
using System.Linq;
using Xunit;

namespace MedStream.Tests.PatientIntake;

public class PathwayClassifier_Tests : MedStreamTestBase
{
    private readonly IComplaintTextNormalizer _normalizer;
    private readonly IPathwayClassifier _classifier;

    public PathwayClassifier_Tests()
    {
        _normalizer = Resolve<IComplaintTextNormalizer>();
        _classifier = Resolve<IPathwayClassifier>();
    }

    [Fact]
    public void Normalizer_Should_Canonicalize_Common_Phrases()
    {
        var normalized = _normalizer.Normalize("I can't breathe properly and have phlegm.", new string[0], new string[0]);

        normalized.NormalizedText.ShouldContain("difficulty breathing");
        normalized.NormalizedText.ShouldContain("sputum");
        normalized.Tokens.ShouldContain("difficulty");
        normalized.Tokens.ShouldContain("breathing");
    }

    [Fact]
    public void Classifier_Should_Match_Cough_Pathway_With_Keyword_And_Synonym_Signals()
    {
        var result = _classifier.ClassifyLikelyPathways(
            "I am short of breath with cough and chest tightness.",
            new string[0],
            new[] { "Cough", "Difficulty Breathing" });

        result.SelectedPathwayId.ShouldBe("cough_or_difficulty_breathing");
        result.Candidates.ShouldNotBeEmpty();
        result.Candidates[0].MatchedSignals.ShouldContain(item => item.SignalType == "synonym");
        result.Candidates[0].MatchedSignals.ShouldContain(item => item.SignalType == "complaint_keyword_exact");
    }

    [Fact]
    public void Classifier_Should_Apply_Exclusion_Penalties()
    {
        var result = _classifier.ClassifyLikelyPathways(
            "I have pain only when turning neck.",
            new string[0],
            new string[0]);

        var coughCandidate = result.Candidates.FirstOrDefault(item => item.PathwayId == "cough_or_difficulty_breathing");
        if (coughCandidate != null)
        {
            coughCandidate.MatchedSignals.ShouldContain(item => item.SignalType == "exclude_phrase_penalty");
        }
    }

    [Fact]
    public void Classifier_Should_Use_Category_And_BodyRegion_Signals_For_Injury()
    {
        var result = _classifier.ClassifyLikelyPathways(
            "My hand is swollen and painful after a fall.",
            new string[0],
            new[] { "Swelling", "Injury" });

        result.LikelyPathwayIds.ShouldContain("hand_or_upper_limb_injury");
        var injury = result.Candidates.First(item => item.PathwayId == "hand_or_upper_limb_injury");
        injury.MatchedSignals.ShouldContain(item => item.SignalType == "symptom_category");
        injury.MatchedSignals.ShouldContain(item => item.SignalType == "body_region");
    }

    [Fact]
    public void Classifier_Should_Return_Multiple_Candidates_For_Multi_Complaint_Input()
    {
        var result = _classifier.ClassifyLikelyPathways(
            "I have a cough and my hand is swollen after I fell.",
            new string[0],
            new[] { "Cough", "Swelling" });

        result.LikelyPathwayIds.ShouldContain("cough_or_difficulty_breathing");
        result.LikelyPathwayIds.ShouldContain("hand_or_upper_limb_injury");
        result.Candidates.Count.ShouldBeGreaterThanOrEqualTo(2);
    }

    [Fact]
    public void Classifier_Should_Exclude_NonEntry_Pathways()
    {
        var result = _classifier.ClassifyLikelyPathways(
            "I have cough and fever.",
            new string[0],
            new[] { "Cough", "Fever" });

        result.LikelyPathwayIds.ShouldNotContain("general_adult_fever_cough");
    }

    [Fact]
    public void Classifier_Should_Recommend_Disambiguation_For_Low_Confidence()
    {
        var result = _classifier.ClassifyLikelyPathways(
            "Pain.",
            new string[0],
            new string[0]);

        result.ShouldAskDisambiguation.ShouldBeTrue();
        result.ConfidenceBand.ShouldBe(ClassificationConfidenceBand.Low);
        result.DisambiguationPrompt.ShouldNotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Classifier_Should_Fallback_To_General_Pathway_When_No_Strong_Match()
    {
        var result = _classifier.ClassifyLikelyPathways(
            "asdf qwerty zxcv lorem ipsum",
            new string[0],
            new string[0]);

        result.SelectedPathwayId.ShouldBe(PatientIntakeConstants.GeneralFallbackPathwayKey);
        result.LikelyPathwayIds.ShouldContain(PatientIntakeConstants.GeneralFallbackPathwayKey);
        result.ShouldAskDisambiguation.ShouldBeTrue();
    }
}
