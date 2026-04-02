using Castle.Core.Logging;
using MedStream.PatientIntake.Dto;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace MedStream.PatientIntake.Pathways;

public partial class PathwayExtractionService
{
    private async Task<List<string>> TryExtractSymptomsWithOpenAiAsync(string freeText, IReadOnlyCollection<string> selectedSymptoms)
    {
        var apiKey = GetOpenAiSetting("OpenAI:ApiKey") ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            Logger.Warn("[Intake][Extract] OPENAI_API_KEY missing; skipping AI extraction.");
            return null;
        }

        var model = GetOpenAiSetting("OpenAI:Model") ?? "gpt-4o-mini";
        var endpoint = (GetOpenAiSetting("OpenAI:BaseUrl") ?? "https://api.openai.com/v1").TrimEnd('/') + "/chat/completions";
        var userText = $"{freeText}\nSelected: {string.Join(", ", selectedSymptoms ?? Array.Empty<string>())}";

        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        var payload = new
        {
            model,
            temperature = 0,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = "Extract up to three primary medical symptoms from patient text. Return JSON only with key primarySymptoms as an array of short strings."
                },
                new
                {
                    role = "user",
                    content = userText
                }
            }
        };

        try
        {
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            using var response = await httpClient.PostAsync(endpoint, content);
            if (!response.IsSuccessStatusCode)
            {
                Logger.Warn($"[Intake][Extract] AI extraction HTTP failure. statusCode={(int)response.StatusCode}.");
                return null;
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(responseJson);
            var completionContent = document.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();
            if (string.IsNullOrWhiteSpace(completionContent))
            {
                return null;
            }

            using var extractionDoc = JsonDocument.Parse(completionContent);
            if (!extractionDoc.RootElement.TryGetProperty("primarySymptoms", out var symptomsElement) || symptomsElement.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            var extracted = symptomsElement.EnumerateArray()
                .Where(item => item.ValueKind == JsonValueKind.String)
                .Select(item => item.GetString())
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Select(item => item.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(3)
                .ToList();

            return extracted.Count == 0 ? null : extracted;
        }
        catch (Exception exception)
        {
            Logger.Warn($"[Intake][Extract] AI extraction exception: {exception.Message}");
            return null;
        }
    }

}
