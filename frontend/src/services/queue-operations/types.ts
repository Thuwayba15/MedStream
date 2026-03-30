export type TQueueStatus = "waiting" | "called" | "in_consultation" | "completed" | "cancelled";

export type TUrgencyLevel = "Urgent" | "Priority" | "Routine";

export interface IClinicianQueueItem {
    queueTicketId: number;
    visitId: number;
    patientUserId: number;
    patientName: string;
    queueNumber: number;
    queueStatus: TQueueStatus;
    currentStage: string;
    urgencyLevel: TUrgencyLevel;
    priorityScore: number;
    enteredQueueAt: string;
    waitingMinutes: number;
    isActive: boolean;
}

export interface IClinicianQueueResponse {
    totalCount: number;
    items: IClinicianQueueItem[];
}

export interface IGetClinicianQueueRequest {
    searchText?: string;
    queueStatuses?: TQueueStatus[];
    urgencyLevels?: TUrgencyLevel[];
    skipCount?: number;
    maxResultCount?: number;
}

export interface IClinicianQueueReview {
    queueTicketId: number;
    visitId: number;
    patientUserId: number;
    patientName: string;
    queueNumber: number;
    queueStatus: TQueueStatus;
    currentStage: string;
    waitingMinutes: number;
    enteredQueueAt: string;
    urgencyLevel: TUrgencyLevel;
    priorityScore: number;
    triageExplanation: string;
    redFlags: string[];
    chiefComplaint: string;
    selectedSymptoms: string[];
    extractedPrimarySymptoms: string[];
    subjectiveSummary: string;
    consultationPath: string;
    patientHistoryPath: string;
}

export interface IUpdateQueueStatusRequest {
    queueTicketId: number;
    newStatus: TQueueStatus;
    note?: string;
}

export interface IUpdateQueueStatusResponse {
    queueTicketId: number;
    oldStatus: TQueueStatus;
    newStatus: TQueueStatus;
    currentStage: string;
    changedAt: string;
    visitId: number;
    patientUserId: number;
}
