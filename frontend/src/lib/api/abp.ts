import { AxiosError } from "axios";

interface IAbpValidationError {
    message?: string;
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
    if (error instanceof AxiosError) {
        const responseData: unknown = error.response?.data;

        if (isAbpEnvelope(responseData) && responseData.error) {
            return buildAbpErrorMessage(responseData.error, fallbackMessage);
        }

        if (typeof responseData === "string" && responseData.trim().length > 0) {
            return responseData;
        }

        if (error.message) {
            return error.message;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallbackMessage;
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

const isAbpEnvelope = <T>(payload: IAbpResponseEnvelope<T> | T): payload is IAbpResponseEnvelope<T> => {
    if (!payload || typeof payload !== "object") {
        return false;
    }

    return "result" in payload || "success" in payload || "error" in payload;
};
