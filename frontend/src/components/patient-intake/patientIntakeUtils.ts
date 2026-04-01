import type { IIntakeQuestion } from "@/services/patient-intake/types";

export type SpeechRecognitionConstructor = new () => ISpeechRecognition;

interface ISpeechRecognitionResultAlternative {
    transcript: string;
}

interface ISpeechRecognitionResult {
    isFinal: boolean;
    0: ISpeechRecognitionResultAlternative;
}

export interface ISpeechRecognitionEvent {
    results: {
        length: number;
        [index: number]: ISpeechRecognitionResult;
    };
}

export interface ISpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: ((event: ISpeechRecognitionEvent) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
}

interface IExtendedWindow extends Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export interface ICheckInStepProps {
    facilityName: string;
    selectedFacilityId: number | null;
    facilities: Array<{ id: number; name: string }>;
    styles: Record<string, string>;
    onSelectFacility: (value: number) => void;
}

export interface ISymptomsStepProps {
    freeText: string;
    selectedSymptoms: string[];
    styles: Record<string, string>;
    isListening: boolean;
    speechSupported: boolean;
    onChangeFreeText: (value: string) => void;
    onToggleSymptom: (value: string) => void;
    onStartSpeech: () => void;
    onStopSpeech: () => void;
}

export interface IFollowUpStepProps {
    extractedPrimarySymptoms: string[];
    questions: IIntakeQuestion[];
    answers: Record<string, string | number | boolean | string[]>;
    onSetAnswer: (questionKey: string, value: string | number | boolean | string[]) => void;
    styles: Record<string, string>;
}

export interface IUrgentCheckStepProps {
    questions: IIntakeQuestion[];
    answers: Record<string, string | number | boolean | string[]>;
    onSetAnswer: (questionKey: string, value: string | number | boolean | string[]) => void;
    urgentMessage: string | null;
    urgentTriggered: boolean;
    styles: Record<string, string>;
}

export interface IStatusStepProps {
    triage: {
        urgencyLevel: "Routine" | "Priority" | "Urgent";
        explanation: string;
        redFlags: string[];
    } | null;
    queue: {
        positionPending: boolean;
        message: string;
        lastUpdatedAt: string;
    } | null;
    styles: Record<string, string>;
}

export const stepDescription = (step: number): string => {
    if (step === 0) {
        return "Choose your hospital and get ready to begin your visit check-in.";
    }

    if (step === 1) {
        return "We ask a few quick safety questions before moving on.";
    }

    if (step === 2) {
        return "Tell us what you are feeling in your own words, by typing or speaking.";
    }

    if (step === 3) {
        return "Answer a few follow-up questions so we can understand your symptoms better.";
    }

    return "See your triage result and current queue status.";
};

export const resolveSpeechRecognitionApi = (): SpeechRecognitionConstructor | null => {
    if (typeof window === "undefined") {
        return null;
    }

    const browserWindow = window as IExtendedWindow;
    return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
};
