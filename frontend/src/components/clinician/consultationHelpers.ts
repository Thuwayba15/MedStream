"use client";

import type { IConsultationInboxItem, IConsultationWorkspace } from "@/services/consultation/types";
import type { TQueueStatus } from "@/services/queue-operations/types";

export interface IClinicianConsultationPageProps {
    visitId?: number;
    queueTicketId?: number;
    patientUserId?: number;
}

export interface INoteDraftState {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    clinicianTimelineSummary: string;
    patientTimelineSummary: string;
}

export interface IVitalsDraftState {
    bloodPressureSystolic: string;
    bloodPressureDiastolic: string;
    heartRate: string;
    respiratoryRate: string;
    temperatureCelsius: string;
    oxygenSaturation: string;
    bloodGlucose: string;
    weightKg: string;
}

export const createNoteDraft = (): INoteDraftState => ({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    clinicianTimelineSummary: "",
    patientTimelineSummary: "",
});

export const createVitalsDraft = (): IVitalsDraftState => ({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    respiratoryRate: "",
    temperatureCelsius: "",
    oxygenSaturation: "",
    bloodGlucose: "",
    weightKg: "",
});

export const asNumber = (value: string): number | null => {
    const parsed = Number(value);
    return value.trim() && Number.isFinite(parsed) ? parsed : null;
};

const humanizeClinicalLabel = (label: string): string => {
    const normalized = label.trim().toLowerCase();
    if (!normalized) {
        return "";
    }

    if (normalized === "selected symptoms" || normalized === "extracted primary symptoms") {
        return "Symptoms reported";
    }

    if (normalized === "follow-up answers") {
        return "Key details";
    }

    if (normalized === "primary concern") {
        return "Primary concern";
    }

    if (normalized === "chief complaint") {
        return "Chief complaint";
    }

    if (normalized === "triage category") {
        return "Triage category";
    }

    if (normalized === "please describe your main concern in one sentence.") {
        return "Main concern";
    }

    if (normalized === "select any danger signs now.") {
        return "Danger signs reported";
    }

    return label.trim();
};

const humanizeStructuredSegment = (segment: string): string => {
    const trimmedSegment = segment.trim().replace(/\.$/, "");
    if (!trimmedSegment) {
        return "";
    }

    const parts = trimmedSegment.split(":");
    if (parts.length < 2) {
        return trimmedSegment.endsWith(".") ? trimmedSegment : `${trimmedSegment}.`;
    }

    const rawLabel = parts.shift()?.trim() ?? "";
    const value = parts.join(":").trim();
    if (!rawLabel || !value) {
        return "";
    }

    if (value === "[]") {
        return "";
    }

    if (/^(false|no)$/i.test(value)) {
        return "";
    }

    const friendlyLabel = humanizeClinicalLabel(rawLabel);
    if (/^(true|yes)$/i.test(value)) {
        return `${friendlyLabel}.`;
    }

    if (friendlyLabel === "Symptoms reported") {
        return `${friendlyLabel}: ${value}.`;
    }

    return `${friendlyLabel}: ${value}.`;
};

export const sanitizeClinicalCopy = (value?: string | null): string => {
    if (!value?.trim()) {
        return "";
    }

    let cleaned = value
        .replace(/Follow-up answers:/gi, "Key details:")
        .replace(/urgentSevereBreathing:\s*True/gi, "Severe difficulty breathing reported")
        .replace(/urgentSevereChestPain:\s*True/gi, "Severe chest pain reported")
        .replace(/urgentUncontrolledBleeding:\s*True/gi, "Uncontrolled bleeding reported")
        .replace(/urgentCollapse:\s*True/gi, "Collapse or blackout reported")
        .replace(/urgentConfusion:\s*True/gi, "Confusion or reduced responsiveness reported")
        .replace(/urgent[A-Za-z]+:\s*False;?/g, "")
        .trim();

    const rawSections = cleaned
        .split(/\r?\n|(?=Chief complaint:|Selected symptoms:|Extracted primary symptoms:|Key details:|Primary concern:|Symptoms reported:|Triage category:)/gi)
        .map((segment) => segment.replace(/\s+/g, " ").trim())
        .filter(Boolean);

    const seen = new Set<string>();
    const rendered = rawSections
        .map((section) => {
            const parts = section.split(":");
            if (parts.length < 2) {
                const plain = section.endsWith(".") ? section : `${section}.`;
                if (seen.has(plain.toLowerCase())) {
                    return "";
                }

                seen.add(plain.toLowerCase());
                return plain;
            }

            const rawLabel = parts.shift()?.trim() ?? "";
            const valuePart = parts.join(":").trim();
            const label = humanizeClinicalLabel(rawLabel);

            if (!valuePart) {
                return "";
            }

            if (label === "Key details") {
                const detailText = valuePart
                    .split(";")
                    .map((segment) => humanizeStructuredSegment(segment))
                    .filter(Boolean)
                    .join("\n");
                const summary = detailText ? `${label}:\n${detailText}` : "";
                if (!summary || seen.has(summary.toLowerCase())) {
                    return "";
                }

                seen.add(summary.toLowerCase());
                return summary;
            }

            const summary = `${label}: ${valuePart.replace(/\s+/g, " ").trim()}`.trim();
            if (summary.endsWith(": []")) {
                return "";
            }

            if (seen.has(summary.toLowerCase())) {
                return "";
            }

            seen.add(summary.toLowerCase());
            return summary;
        })
        .filter(Boolean);

    cleaned = rendered.length > 0 ? rendered.join("\n\n") : cleaned;
    cleaned = cleaned
        .replace(/Symptoms reported:\s*([^\n.]*)\s*Symptoms reported:/gi, "Symptoms reported: $1 ")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\s+\./g, ".")
        .trim();

    return cleaned;
};

export const formatVisitStartedAt = (value?: string): string => {
    const parsed = value ? new Date(value) : null;
    return parsed && !Number.isNaN(parsed.getTime())
        ? `Started ${parsed.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg" })}`
        : "Consultation in progress";
};

const normalizeSentence = (value?: string | null): string => {
    if (!value?.trim()) {
        return "";
    }

    const collapsed = value.replace(/\s+/g, " ").trim();
    if (!collapsed) {
        return "";
    }

    return /[.!?]$/.test(collapsed) ? collapsed : `${collapsed}.`;
};

const toSummarySentence = (value?: string | null): string => {
    const cleaned = sanitizeClinicalCopy(value);
    if (!cleaned) {
        return "";
    }

    const flattened = cleaned
        .split(/\r?\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ");

    return normalizeSentence(flattened);
};

export const buildClinicianTimelineSummary = (workspace: IConsultationWorkspace, clinicianSummary?: string | null): string => {
    const encounterSummary = normalizeSentence(workspace.encounterNote.clinicianTimelineSummary);
    if (encounterSummary) {
        return encounterSummary;
    }

    return toSummarySentence(clinicianSummary) || toSummarySentence(workspace.encounterNote.assessment) || toSummarySentence(workspace.patientContext.subjectiveSummary);
};

export const buildPatientTimelineSummary = (workspace: IConsultationWorkspace): string => {
    const encounterSummary = normalizeSentence(workspace.encounterNote.patientTimelineSummary);
    if (encounterSummary) {
        return encounterSummary;
    }

    return (
        normalizeSentence(workspace.patientContext.chiefComplaint) ||
        toSummarySentence(workspace.encounterNote.plan) ||
        toSummarySentence(workspace.encounterNote.assessment) ||
        toSummarySentence(workspace.patientContext.subjectiveSummary)
    );
};

export const getUrgencyClassName = (urgencyLevel: string, styles: Record<string, string>): string => {
    if (urgencyLevel === "Urgent") {
        return styles.urgencyUrgent;
    }

    if (urgencyLevel === "Routine") {
        return styles.urgencyRoutine;
    }

    return styles.urgencyPriority;
};

export const getStatusLabel = (status?: TQueueStatus | string): string => {
    if (!status) {
        return "queue active";
    }

    return status.replaceAll("_", " ");
};

export const isConcerning = (label: string, vitals?: IConsultationWorkspace["latestVitals"]): boolean => {
    switch (label) {
        case "BP":
            return Boolean((vitals?.bloodPressureSystolic ?? 0) >= 140 || (vitals?.bloodPressureDiastolic ?? 0) >= 90);
        case "HR":
            return Boolean((vitals?.heartRate ?? 0) > 110 || (vitals?.heartRate ?? 999) < 50);
        case "Temp":
            return Boolean((vitals?.temperatureCelsius ?? 0) >= 38 || (vitals?.temperatureCelsius ?? 999) < 35);
        case "SpO2":
            return Boolean((vitals?.oxygenSaturation ?? 100) < 95);
        case "RR":
            return Boolean((vitals?.respiratoryRate ?? 0) > 20 || (vitals?.respiratoryRate ?? 999) < 10);
        default:
            return false;
    }
};

export const buildInboxMeta = (item: IConsultationInboxItem): string => {
    return sanitizeClinicalCopy(item.subjectiveSummary) || item.chiefComplaint || "Resume this consultation note.";
};
