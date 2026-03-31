#nullable enable
using System;
using System.Collections.Generic;

namespace MedStream.Consultation.Dto;

public class ConsultationInboxDto
{
    public List<ConsultationInboxItemDto> Items { get; set; } = new();
}

public class ConsultationInboxItemDto
{
    public long VisitId { get; set; }

    public long? QueueTicketId { get; set; }

    public long PatientUserId { get; set; }

    public string PatientName { get; set; } = string.Empty;

    public string ChiefComplaint { get; set; } = string.Empty;

    public string SubjectiveSummary { get; set; } = string.Empty;

    public string QueueStatus { get; set; } = string.Empty;

    public string UrgencyLevel { get; set; } = string.Empty;

    public string EncounterNoteStatus { get; set; } = string.Empty;

    public DateTime VisitDate { get; set; }

    public DateTime? FinalizedAt { get; set; }

    public DateTime? LastTranscriptAt { get; set; }

    public string ConsultationPath { get; set; } = string.Empty;
}
