"use client";

import type { TUrgencyLevel, TQueueStatus } from "@/services/queue-operations/types";

export const getReviewUrgencyClassName = (urgencyLevel: TUrgencyLevel, styles: Record<string, string>): string => {
    if (urgencyLevel === "Urgent") {
        return styles.urgencyUrgent;
    }

    if (urgencyLevel === "Priority") {
        return styles.urgencyPriority;
    }

    return styles.urgencyRoutine;
};

export const getHumanQueueStatus = (status: TQueueStatus): string => {
    return status.replace("_", " ");
};

export const appendQueryToPath = (path: string, params: Record<string, string | number | undefined>): string => {
    const [basePath, queryString] = path.split("?");
    const query = new URLSearchParams(queryString ?? "");

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }

        query.set(key, String(value));
    });

    const serialized = query.toString();
    return serialized ? `${basePath}?${serialized}` : basePath;
};

export const buildPatientSummary = (selectedSymptoms: string[]): string => {
    return selectedSymptoms.length > 0 ? `Reported symptoms: ${selectedSymptoms.join(", ")}` : "No additional symptom tags were captured.";
};

export const getAssessmentUrgencyClassName = (urgencyLevel: TUrgencyLevel, styles: Record<string, string>): string => {
    if (urgencyLevel === "Urgent") {
        return styles.assessmentUrgent;
    }

    if (urgencyLevel === "Priority") {
        return styles.assessmentPriority;
    }

    return styles.assessmentRoutine;
};

export const getAssessmentIconClassName = (urgencyLevel: TUrgencyLevel, styles: Record<string, string>): string => {
    if (urgencyLevel === "Urgent") {
        return styles.assessmentIconUrgent;
    }

    if (urgencyLevel === "Priority") {
        return styles.assessmentIconPriority;
    }

    return styles.assessmentIconRoutine;
};

export const getReasoningDotClassName = (urgencyLevel: TUrgencyLevel, styles: Record<string, string>): string => {
    if (urgencyLevel === "Urgent") {
        return styles.reasoningDotUrgent;
    }

    if (urgencyLevel === "Priority") {
        return styles.reasoningDotPriority;
    }

    return styles.reasoningDotRoutine;
};
