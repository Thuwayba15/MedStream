using MedStream.Consultation;
using Shouldly;
using Xunit;

namespace MedStream.Tests.Consultation;

public class ConsultationPathwayGuidanceResolver_Tests : MedStreamTestBase
{
    private readonly IConsultationPathwayGuidanceResolver _resolver;

    public ConsultationPathwayGuidanceResolver_Tests()
    {
        _resolver = Resolve<IConsultationPathwayGuidanceResolver>();
    }

    [Fact]
    public void Resolve_Should_Return_Pathway_And_Apc_Guidance_For_Known_Pathway()
    {
        var guidance = _resolver.Resolve("cough_or_difficulty_breathing", "Cough and difficulty breathing for three days");

        guidance.PathwayName.ShouldBe("Cough or Difficulty Breathing");
        guidance.PathwayAssessmentHints.ShouldContain("Pneumonia likely");
        guidance.PathwayPlanHints.ShouldContain("Supportive care and return precautions");
        guidance.ObjectiveFocusHints.ShouldContain(item => item.Contains("Oxygen saturation"));
        guidance.ApcReferenceLinks.Count.ShouldBeGreaterThan(0);
    }
}
