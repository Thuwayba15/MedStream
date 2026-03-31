export const getSupportedRecordingMimeType = (): string => {
    if (typeof MediaRecorder === "undefined") {
        return "";
    }

    const preferredTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

    return preferredTypes.find((value) => MediaRecorder.isTypeSupported?.(value)) ?? "";
};
