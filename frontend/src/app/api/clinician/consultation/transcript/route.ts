import { getAbpErrorMessage } from "@/lib/api/abp";
import { requireClinicianAccessToken } from "@/lib/server/clinicianAuthGuard";
import { consultationService } from "@/services/consultation/consultationService";
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
            const result = await consultationService.attachConsultationTranscript(
                {
                    visitId,
                    inputMode: "audio_upload",
                    rawTranscriptText: transcription.text,
                    languageDetected: transcription.languageDetected,
                },
                guardResult.accessToken
            );

            return NextResponse.json(result);
        }

        const body = (await request.json()) as IAttachConsultationTranscriptRequest;
        if (!body.visitId) {
            return NextResponse.json({ message: "Visit id is required." }, { status: 400 });
        }

        const result = await consultationService.attachConsultationTranscript(body, guardResult.accessToken);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ message: getAbpErrorMessage(error, "Unable to attach consultation transcript.") }, { status: 400 });
    }
};
