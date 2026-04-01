export interface IGetPatientTimelineRequest {
    patientUserId: number;
}

export interface IPatientTimelineRecord {
    title: string;
    detail: string;
    status: string;
}

export interface IPatientTimelinePatient {
    patientUserId: number;
    patientName: string;
    dateOfBirth?: string | null;
    idNumber?: string | null;
    totalVisits: number;
    mostRecentVisitAt?: string | null;
}

export interface IPatientTimelineVisit {
    visitId: number;
    visitDate: string;
    visitStatus: string;
    facilityId?: number | null;
    facilityName: string;
    title: string;
    chiefComplaint: string;
    summary: string;
    summarySource: string;
    urgencyLevel?: string | null;
    queueStatus?: string | null;
    clinicianName?: string | null;
    finalizedAt?: string | null;
}

export interface IPatientTimelineEvent {
    eventId: string;
    visitId: number;
    eventType: string;
    title: string;
    summary: string;
    occurredAt: string;
    facilityId?: number | null;
    facilityName: string;
    status: string;
    recordedByName?: string | null;
    provenance: string;
    urgencyLevel?: string | null;
}

export interface IPatientTimeline {
    isClinicianView: boolean;
    patient: IPatientTimelinePatient;
    visits: IPatientTimelineVisit[];
    timeline: IPatientTimelineEvent[];
    conditions: IPatientTimelineRecord[];
    allergies: IPatientTimelineRecord[];
    medications: IPatientTimelineRecord[];
}
