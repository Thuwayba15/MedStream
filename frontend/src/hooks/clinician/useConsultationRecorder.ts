"use client";

import { useEffect, useRef, useState } from "react";
import { getSupportedRecordingMimeType } from "@/lib/client/audioRecording";

interface IUseConsultationRecorderParams {
    visitId?: number;
    onTranscriptReady: (transcript: string) => void;
    transcribeAudio: (params: { visitId: number; audioBlob: Blob; mimeType: string }) => Promise<{ rawTranscriptText?: string | null } | null | undefined>;
}

interface IUseConsultationRecorderResult {
    isRecording: boolean;
    isTranscribing: boolean;
    recordingSeconds: number;
    recordingError: string | null;
    clearRecordingError: () => void;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
}

export const useConsultationRecorder = ({
    visitId,
    onTranscriptReady,
    transcribeAudio,
}: IUseConsultationRecorderParams): IUseConsultationRecorderResult => {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [recordingError, setRecordingError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (recordingTimerRef.current !== null) {
                window.clearInterval(recordingTimerRef.current);
            }

            mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    const startRecording = async (): Promise<void> => {
        if (!visitId) {
            return;
        }

        if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
            setRecordingError("Live transcription is not supported in this browser. You can still paste consultation notes manually.");
            return;
        }

        try {
            setRecordingError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = getSupportedRecordingMimeType();
            const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
            mediaStreamRef.current = stream;
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            setRecordingSeconds(0);
            setIsRecording(true);
            recordingTimerRef.current = window.setInterval(() => setRecordingSeconds((current) => current + 1), 1000);

            recorder.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onerror = () => setRecordingError("The browser could not continue recording consultation audio.");
            recorder.onstop = async () => {
                if (recordingTimerRef.current !== null) {
                    window.clearInterval(recordingTimerRef.current);
                    recordingTimerRef.current = null;
                }

                setIsRecording(false);
                const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
                audioChunksRef.current = [];
                stream.getTracks().forEach((track) => track.stop());
                mediaRecorderRef.current = null;
                mediaStreamRef.current = null;

                if (audioBlob.size === 0) {
                    setRecordingError("No consultation audio was captured. Please try again.");
                    return;
                }

                setIsTranscribing(true);
                const transcript = await transcribeAudio({
                    visitId,
                    audioBlob,
                    mimeType: audioBlob.type,
                });
                setIsTranscribing(false);

                if (transcript?.rawTranscriptText) {
                    onTranscriptReady(transcript.rawTranscriptText);
                }
            };

            recorder.start();
        } catch (error) {
            setIsRecording(false);
            setRecordingError(error instanceof Error ? error.message : "Microphone access was denied.");
        }
    };

    const stopRecording = (): void => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    return {
        isRecording,
        isTranscribing,
        recordingSeconds,
        recordingError,
        clearRecordingError: () => setRecordingError(null),
        startRecording,
        stopRecording,
    };
};
