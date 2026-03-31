interface IConsultationAudioTranscriptionResult {
    text: string;
    languageDetected?: string | null;
}

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";

const getOpenAiApiKey = (): string => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
        throw new Error("Audio transcription is not configured. Set OPENAI_API_KEY to enable consultation transcription.");
    }

    return apiKey;
};

export const transcribeConsultationAudio = async (audioFile: File, language?: string): Promise<IConsultationAudioTranscriptionResult> => {
    const apiKey = getOpenAiApiKey();
    const formData = new FormData();
    formData.append("file", audioFile, audioFile.name || `consultation-${Date.now()}.webm`);
    formData.append("model", process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || DEFAULT_TRANSCRIPTION_MODEL);
    if (language?.trim()) {
        formData.append("language", language.trim());
    }

    const response = await fetch(`${process.env.OPENAI_BASE_URL?.trim() || DEFAULT_OPENAI_BASE_URL}/audio/transcriptions`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Unable to transcribe consultation audio.");
    }

    const payload = (await response.json()) as { text?: string; language?: string };
    if (!payload.text?.trim()) {
        throw new Error("The transcription service returned no transcript text.");
    }

    return {
        text: payload.text.trim(),
        languageDetected: payload.language?.trim() || null,
    };
};
