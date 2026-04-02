using System;
using System.Collections.Generic;
using System.Linq;

namespace MedStream.Consultation;

public partial class ConsultationDraftGenerator
{
    private static string BuildPhysiologicInterpretation(string latestVitalsSummary)
    {
        if (string.IsNullOrWhiteSpace(latestVitalsSummary))
        {
            return string.Empty;
        }

        var interpretations = new List<string>();
        var summary = latestVitalsSummary;

        if (TryReadVital(summary, "BP", out var systolic, out var diastolic))
        {
            if (systolic <= 100 || diastolic <= 60)
            {
                interpretations.Add("may reflect low blood pressure contributing to the current symptoms");
            }
            else if (systolic >= 140 || diastolic >= 90)
            {
                interpretations.Add("show elevated blood pressure that should be interpreted with the clinical picture");
            }
        }

        if (TryReadSingleVital(summary, "HR", out var heartRate))
        {
            if (heartRate >= 100)
            {
                interpretations.Add("show tachycardia");
            }
            else if (heartRate < 50)
            {
                interpretations.Add("show bradycardia");
            }
        }

        if (TryReadSingleVital(summary, "RR", out var respiratoryRate) && respiratoryRate > 20)
        {
            interpretations.Add("suggest increased respiratory effort");
        }

        if (TryReadDecimalVital(summary, "Temp", out var temperature) && temperature >= 38m)
        {
            interpretations.Add("suggest fever");
        }

        if (TryReadSingleVital(summary, "SpO2", out var spo2) && spo2 < 95)
        {
            interpretations.Add("show reduced oxygen saturation");
        }

        if (TryReadDecimalVital(summary, "Glucose", out var glucose) && (glucose < 3.9m || glucose <= 20m))
        {
            interpretations.Add("show a low glucose reading that should be confirmed urgently and interpreted clinically");
        }

        return JoinWithAnd(interpretations);
    }

    private static List<string> BuildActionPlanHints(string latestVitalsSummary, string cleanedSubjective, string cleanedObjective, IReadOnlyCollection<string> objectiveFocusHints)
    {
        var hints = new List<string>();

        if (TryReadDecimalVital(latestVitalsSummary, "Glucose", out var glucose) && (glucose < 3.9m || glucose <= 20m))
        {
            hints.Add("repeat the glucose measurement promptly and address possible hypoglycaemia if confirmed");
        }

        if (TryReadVital(latestVitalsSummary, "BP", out var systolic, out var diastolic) && (systolic <= 100 || diastolic <= 60))
        {
            hints.Add("recheck blood pressure and assess volume status or orthostatic symptoms if clinically appropriate");
        }

        if (TryReadSingleVital(latestVitalsSummary, "HR", out var heartRate) && heartRate >= 100)
        {
            hints.Add("repeat pulse and reassess for causes of tachycardia in the current presentation");
        }

        if (TryReadSingleVital(latestVitalsSummary, "SpO2", out var oxygenSaturation) && oxygenSaturation < 95)
        {
            hints.Add("reassess oxygen saturation promptly, review work of breathing, and evaluate for respiratory compromise if clinically indicated");
        }

        if (!string.IsNullOrWhiteSpace(cleanedObjective))
        {
            hints.Add("document any progression or change in the recorded examination findings");
        }

        if (objectiveFocusHints.Count > 0)
        {
            hints.Add($"complete focused examination for {JoinWithAnd(objectiveFocusHints.Take(2))}");
        }

        if (cleanedSubjective.Contains("dizziness", StringComparison.OrdinalIgnoreCase))
        {
            hints.Add("review neurological and cardiovascular contributors to the dizziness during the bedside assessment");
        }

        if (cleanedSubjective.Contains("nausea", StringComparison.OrdinalIgnoreCase) ||
            cleanedSubjective.Contains("vomit", StringComparison.OrdinalIgnoreCase))
        {
            hints.Add("assess hydration status, oral intake, and any progression of nausea or vomiting");
        }

        return hints
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static bool TryReadVital(string summary, string label, out int left, out int right)
    {
        left = 0;
        right = 0;
        var marker = $"{label} ";
        var startIndex = summary.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (startIndex < 0)
        {
            return false;
        }

        var valueStart = startIndex + marker.Length;
        var valueEnd = summary.IndexOf(',', valueStart);
        var value = (valueEnd >= 0 ? summary[valueStart..valueEnd] : summary[valueStart..]).Trim();
        var parts = value.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length == 2 &&
               int.TryParse(parts[0].Trim(), out left) &&
               int.TryParse(parts[1].Trim(), out right);
    }

    private static bool TryReadSingleVital(string summary, string label, out int value)
    {
        value = 0;
        var marker = $"{label} ";
        var startIndex = summary.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (startIndex < 0)
        {
            return false;
        }

        var valueStart = startIndex + marker.Length;
        var valueEnd = summary.IndexOf(',', valueStart);
        var rawValue = (valueEnd >= 0 ? summary[valueStart..valueEnd] : summary[valueStart..]).Trim();
        var firstToken = rawValue.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return int.TryParse(firstToken, out value);
    }

    private static bool TryReadDecimalVital(string summary, string label, out decimal value)
    {
        value = 0m;
        var marker = $"{label} ";
        var startIndex = summary.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (startIndex < 0)
        {
            return false;
        }

        var valueStart = startIndex + marker.Length;
        var valueEnd = summary.IndexOf(',', valueStart);
        var rawValue = (valueEnd >= 0 ? summary[valueStart..valueEnd] : summary[valueStart..]).Trim();
        var firstToken = rawValue.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return decimal.TryParse(firstToken, out value);
    }

    private static string BuildGroundingSummary(ConsultationDraftContext context)
    {
        var sources = new List<string> { "current consultation notes" };
        if (!string.IsNullOrWhiteSpace(context.LatestVitalsSummary))
        {
            sources.Add("latest vitals");
        }

        if (context.PathwayAssessmentHints.Count > 0 || context.PathwayPlanHints.Count > 0)
        {
            sources.Add("pathway guidance");
        }

        if (context.ApcReferenceLinks.Count > 0)
        {
            sources.Add("targeted APC references");
        }

        return $"Draft grounded in {JoinWithAnd(sources)}.";
    }
}
