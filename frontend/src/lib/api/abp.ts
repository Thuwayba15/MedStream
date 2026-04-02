import { AxiosError } from "axios";
import type { IAuthFieldError } from "@/lib/auth/types";

interface IAbpValidationError {
    message?: string;
    members?: string[];
}

interface IAbpError {
    message?: string;
    details?: string;
    validationErrors?: IAbpValidationError[];
}

interface IAbpResponseEnvelope<T> {
    success?: boolean;
    result?: T;
    error?: IAbpError;
}

export const unwrapAbpResponse = <T>(payload: IAbpResponseEnvelope<T> | T): T => {
    if (isAbpEnvelope<T>(payload)) {
        if (payload.success === false) {
            throw new Error(buildAbpErrorMessage(payload.error, "Backend request failed."));
        }

        if (payload.result !== undefined) {
            return payload.result;
        }
    }

    return payload as T;
};

export const getAbpErrorMessage = (error: unknown, fallbackMessage: string): string => {
    return getAbpErrorDetails(error, fallbackMessage).message;
};

export const getAbpErrorDetails = (error: unknown, fallbackMessage: string): { message: string; fieldErrors: IAuthFieldError[] } => {
    if (error instanceof AxiosError) {
        const responseData: unknown = error.response?.data;

        if (isAbpEnvelope(responseData) && responseData.error) {
            return {
                message: buildAbpErrorMessage(responseData.error, fallbackMessage),
                fieldErrors: buildAbpFieldErrors(responseData.error),
            };
        }

        if (typeof responseData === "string" && responseData.trim().length > 0) {
            return { message: responseData, fieldErrors: [] };
        }

        if (error.message) {
            return { message: error.message, fieldErrors: [] };
        }
    }

    if (error instanceof Error) {
        return { message: error.message, fieldErrors: [] };
    }

    return { message: fallbackMessage, fieldErrors: [] };
};

const buildAbpErrorMessage = (error: IAbpError | undefined, fallbackMessage: string): string => {
    if (!error) {
        return fallbackMessage;
    }

    const firstValidationMessage = error.validationErrors?.find((validationError) => !!validationError.message)?.message?.trim();
    if (firstValidationMessage) {
        return firstValidationMessage;
    }

    if (error.message?.trim()) {
        return error.message.trim();
    }

    if (error.details?.trim()) {
        return error.details.trim();
    }

    return fallbackMessage;
};

const buildAbpFieldErrors = (error: IAbpError | undefined): IAuthFieldError[] => {
    if (!error?.validationErrors?.length) {
        return [];
    }

    return error.validationErrors.flatMap((validationError) => {
        const message = validationError.message?.trim();
        if (!message) {
            return [];
        }

        const members = validationError.members?.filter((member) => member.trim().length > 0) ?? [];
        if (members.length === 0) {
            return [];
        }

        return members.map((member) => ({
            field: toCamelCase(member),
            message,
        }));
    });
};

const toCamelCase = (value: string): string => {
    if (!value) {
        return value;
    }

    return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
};

const isAbpEnvelope = <T>(payload: IAbpResponseEnvelope<T> | T): payload is IAbpResponseEnvelope<T> => {
    if (!payload || typeof payload !== "object") {
        return false;
    }

    return "result" in payload || "success" in payload || "error" in payload;
};
