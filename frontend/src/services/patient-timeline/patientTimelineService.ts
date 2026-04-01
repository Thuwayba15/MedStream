import { API } from "@/constants/api";
import { unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import type { IGetPatientTimelineRequest, IPatientTimeline } from "./types";

const getAuthorizationHeader = (accessToken: string): { Authorization: string } => {
    return { Authorization: `Bearer ${accessToken}` };
};

const getPatientTimeline = async (payload: IGetPatientTimelineRequest, accessToken: string): Promise<IPatientTimeline> => {
    const response = await apiClient.get(API.PATIENT_TIMELINE_GET_ENDPOINT, {
        params: {
            patientUserId: payload.patientUserId,
        },
        headers: getAuthorizationHeader(accessToken),
    });

    return unwrapAbpResponse<IPatientTimeline>(response.data);
};

const getMyTimeline = async (accessToken: string): Promise<IPatientTimeline> => {
    const response = await apiClient.get(API.PATIENT_TIMELINE_GET_MY_ENDPOINT, {
        headers: getAuthorizationHeader(accessToken),
    });

    return unwrapAbpResponse<IPatientTimeline>(response.data);
};

export const patientTimelineService = {
    getPatientTimeline,
    getMyTimeline,
};
