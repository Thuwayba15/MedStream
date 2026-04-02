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

export interface IIntakeJourneyItem {
    step: number;
    title: string;
    description: string;
    active: boolean;
}

export const stepDescription = (step: number): string => {
    if (step === 0) {
        return "Choose your facility and get ready to begin your visit check-in.";
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

export const getIntakeJourneyItems = (currentStep: number): IIntakeJourneyItem[] => {
    return [
        {
            step: 1,
            title: "Check-in",
            description: "Choose your hospital and start your intake.",
            active: currentStep === 0,
        },
        {
            step: 2,
            title: "Quick safety questions",
            description: "We ask a few important questions to spot urgent warning signs early.",
            active: currentStep === 1,
        },
        {
            step: 3,
            title: "Tell us your symptoms",
            description: "You can type or speak about what brought you in today.",
            active: currentStep === 2,
        },
        {
            step: 4,
            title: "A few follow-up questions",
            description: "We may ask for a little more detail to understand your symptoms better.",
            active: currentStep === 3,
        },
        {
            step: 5,
            title: "See your queue status",
            description: "We show your triage result and where you are in the visit flow.",
            active: currentStep === 4,
        },
    ];
};

export const getPatientQuestionLabel = (question: IIntakeQuestion): string => {
    const label = question.questionText.trim();

    if (question.inputType === "Number" && /how long have you had/i.test(label) && !/\bday/i.test(label)) {
        return `${label} (in days)`;
    }

    return label;
};

export const resolveSpeechRecognitionApi = (): SpeechRecognitionConstructor | null => {
    if (typeof window === "undefined") {
        return null;
    }

    const browserWindow = window as IExtendedWindow;
    return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
};
