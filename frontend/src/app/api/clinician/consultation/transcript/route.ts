import { API } from "@/constants/api";
import { getAbpErrorMessage, unwrapAbpResponse } from "@/lib/api/abp";
import { apiClient } from "@/lib/api/client";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import type { IAttachConsultationTranscriptRequest } from "@/services/consultation/types";
import { transcribeConsultationAudio } from "@/services/consultation/consultationTranscriptionService";
import { NextResponse } from "next/server";

export const POST = async (request: Request): Promise<Response> => {
    try {
        const guardResult = await requireClinicianAccessToken();
        if (guardResult.errorResponse || !guardResult.accessToken) {
            return guardResult.errorResponse ?? NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
        }

        const contentType = request.headers.get("content-type") ?? "";
        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            const visitId = Number(formData.get("visitId"));
            const audioFile = formData.get("audio");
            const language = formData.get("language");

            if (!visitId) {
                return NextResponse.json({ message: "Visit id is required." }, { status: 400 });
            }

            if (!(audioFile instanceof File) || audioFile.size === 0) {
                return NextResponse.json({ message: "Consultation audio is required." }, { status: 400 });
            }

            const transcription = await transcribeConsultationAudio(audioFile, typeof language === "string" ? language : undefined);
            const response = await apiClient.post(
                API.CONSULTATION_ATTACH_TRANSCRIPT_ENDPOINT,
                {
                    visitId,
                    inputMode: "audio_upload",
                    rawTranscriptText: transcription.text,
                    languageDetected: transcription.languageDetected,
                },
                {
                    headers: { Authorization: `Bearer ${guardResult.accessToken}` },
                }
            );

            return NextResponse.json(unwrapAbpResponse(response.data));
        }

        const body = (await request.json()) as IAttachConsultationTranscriptRequest;
        if (!body.visitId) {
            return NextResponse.json({ message: "Visit id is required." }, { status: 400 });
        }

        const response = await apiClient.post(API.CONSULTATION_ATTACH_TRANSCRIPT_ENDPOINT, body, {
            headers: { Authorization: `Bearer ${guardResult.accessToken}` },
        });
        return NextResponse.json(unwrapAbpResponse(response.data));
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to attach consultation transcript.") }, { status: 400 });
    }
};
