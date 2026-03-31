using MedStream.PatientIntake;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Shouldly;
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace MedStream.Tests.Consultation;

public class ConsultationPersistence_Tests : MedStreamTestBase
{
    [Fact]
    public async Task EncounterNote_Should_Define_Unique_Index_Per_Visit()
    {
        await UsingDbContextAsync(async context =>
        {
            var entityType = context.Model.FindEntityType(typeof(EncounterNote));
            entityType.ShouldNotBeNull();

            var uniqueIndex = entityType!
                .GetIndexes()
                .SingleOrDefault(index =>
                    index.IsUnique
                    && MatchesProperties(index, nameof(EncounterNote.TenantId), nameof(EncounterNote.VisitId)));

            uniqueIndex.ShouldNotBeNull();
        });
    }

    [Fact]
    public async Task VitalSigns_Should_Define_Filtered_Unique_Latest_Index_Per_Visit()
    {
        await UsingDbContextAsync(async context =>
        {
            var entityType = context.Model.FindEntityType(typeof(VitalSigns));
            entityType.ShouldNotBeNull();

            var latestIndex = entityType!
                .GetIndexes()
                .SingleOrDefault(index =>
                    index.IsUnique
                    && MatchesProperties(index, nameof(VitalSigns.TenantId), nameof(VitalSigns.VisitId), nameof(VitalSigns.IsLatest)));

            latestIndex.ShouldNotBeNull();
            latestIndex!.GetFilter().ShouldBe("\"IsDeleted\" = false AND \"IsLatest\" = true");
        });
    }

    [Fact]
    public async Task ConsultationTranscript_Should_Belong_To_EncounterNote()
    {
        await UsingDbContextAsync(async context =>
        {
            var visit = new Visit
            {
                TenantId = 1,
                PatientUserId = 44,
                FacilityId = 1,
                AssignedClinicianUserId = 99,
                VisitDate = DateTime.UtcNow,
                Status = PatientIntakeConstants.VisitStatusInConsultation,
                PathwayKey = PatientIntakeConstants.GeneralFallbackPathwayKey
            };
            await context.Visits.AddAsync(visit);
            await context.SaveChangesAsync();

            var encounterNote = new EncounterNote
            {
                TenantId = 1,
                VisitId = visit.Id,
                CreatedByClinicianUserId = 99,
                IntakeSubjective = "Intake summary",
                Subjective = "Intake summary",
                Status = PatientIntakeConstants.EncounterNoteStatusDraft
            };
            await context.EncounterNotes.AddAsync(encounterNote);
            await context.SaveChangesAsync();

            var transcript = new ConsultationTranscript
            {
                TenantId = 1,
                EncounterNoteId = encounterNote.Id,
                CapturedByClinicianUserId = 99,
                InputMode = PatientIntakeConstants.TranscriptInputModeAudioUpload,
                RawTranscriptText = "Patient describes worsening shortness of breath.",
                LanguageDetected = "en",
                CapturedAt = DateTime.UtcNow
            };
            await context.ConsultationTranscripts.AddAsync(transcript);
            await context.SaveChangesAsync();

            var persistedTranscript = await context.ConsultationTranscripts.SingleAsync(item => item.Id == transcript.Id);
            persistedTranscript.EncounterNoteId.ShouldBe(encounterNote.Id);
            persistedTranscript.RawTranscriptText.ShouldContain("shortness of breath");
        });
    }

    private static bool MatchesProperties(IReadOnlyIndex index, params string[] propertyNames)
    {
        return index.Properties.Select(property => property.Name).SequenceEqual(propertyNames);
    }
}
