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
