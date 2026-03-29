import type { IIntakeQuestion } from "./types";

/**
 * Evaluates a lightweight visibility expression for a question.
 */
export const evaluateShowWhenExpression = (expression: string | null, answers: Record<string, string | number | boolean | string[]>, extractedPrimarySymptoms: string[]): boolean => {
    if (!expression) {
        return true;
    }

    if (expression.startsWith("answer:")) {
        const payload = expression.replace("answer:", "");
        const [questionKey, expectedRaw] = payload.split("=");
        if (!questionKey || expectedRaw === undefined) {
            return true;
        }

        const expected = normalizeExpectedValue(expectedRaw);
        const answer = answers[questionKey];
        if (Array.isArray(answer)) {
            return answer.map((item) => String(item)).includes(String(expected));
        }

        return String(answer) === String(expected);
    }

    if (expression.startsWith("symptom:")) {
        const expectedSymptom = expression.replace("symptom:", "").trim().toLowerCase();
        return extractedPrimarySymptoms.some((symptom) => symptom.toLowerCase() === expectedSymptom);
    }

    return true;
};

/**
 * Returns ordered questions that are currently visible for the given answer set.
 */
export const getVisibleQuestions = (questions: IIntakeQuestion[], answers: Record<string, string | number | boolean | string[]>, extractedPrimarySymptoms: string[]): IIntakeQuestion[] => {
    return [...questions]
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .filter((question) => evaluateShowWhenExpression(question.showWhenExpression, answers, extractedPrimarySymptoms));
};

const normalizeExpectedValue = (value: string): string | boolean => {
    const lower = value.toLowerCase();
    if (lower === "true") {
        return true;
    }

    if (lower === "false") {
        return false;
    }

    return value;
};
