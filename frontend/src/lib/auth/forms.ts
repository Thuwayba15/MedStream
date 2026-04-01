import type { FormInstance, Rule } from "antd/es/form";
import type { IAuthFieldError, ILoginRequest, IRegisterRequest } from "@/lib/auth/types";

export type AccountType = "Patient" | "Clinician";
export type ProfessionType = "Doctor" | "Nurse" | "AlliedHealth" | "Other";
export type RegulatoryBody = "HPCSA" | "SANC" | "Other";

export type LoginFormValues = ILoginRequest;

export interface RegistrationFormValues extends IRegisterRequest {
    accountType: AccountType;
    professionType?: ProfessionType;
    regulatoryBody?: RegulatoryBody;
}

const SOUTH_AFRICAN_PHONE_PATTERN = /^(\+27|0)[6-8][0-9]{8}$/;
const SOUTH_AFRICAN_ID_PATTERN = /^[0-9]{13}$/;
const SOUTH_AFRICAN_REGISTRATION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\-\/]{2,31}$/;
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const applyFieldErrors = <TValues extends object>(form: FormInstance<TValues>, fieldErrors: IAuthFieldError[]): void => {
    form.setFields(
        fieldErrors.map((fieldError) => ({
            name: fieldError.field as never,
            errors: [fieldError.message],
        }))
    );
};

export const clearFieldErrors = <TValues extends object>(form: FormInstance<TValues>, fieldNames: Array<keyof TValues>): void => {
    form.setFields(
        fieldNames.map((fieldName) => ({
            name: fieldName as never,
            errors: [],
        }))
    );
};

export const getPhoneNumberRule = (): Rule => ({
    validator: validatePhoneNumber,
});

export const getPasswordStrengthRule = (): Rule => ({
    validator: validatePasswordStrength,
});

export const getDateOfBirthRule = (): Rule => ({
    validator: validateDateOfBirth,
});

export const getRegistrationNumberRule = (): Rule => ({
    validator: validateRegistrationNumber,
});

export const validatePhoneNumber = async (_: unknown, value: string | undefined): Promise<void> => {
    if (!value || SOUTH_AFRICAN_PHONE_PATTERN.test(value)) {
        return Promise.resolve();
    }

    return Promise.reject(new Error("Use a valid South African mobile number."));
};

export const validatePasswordStrength = async (_: unknown, value: string | undefined): Promise<void> => {
    if (!value || STRONG_PASSWORD_PATTERN.test(value)) {
        return Promise.resolve();
    }

    return Promise.reject(new Error("Password must include upper, lower, and a number."));
};

export const validateDateOfBirth = async (_: unknown, value: string | undefined): Promise<void> => {
    if (!value) {
        return Promise.resolve();
    }

    const selectedDate = new Date(value);
    const today = new Date();
    if (selectedDate <= today) {
        return Promise.resolve();
    }

    return Promise.reject(new Error("Date of birth cannot be in the future."));
};

export const validateIdNumber = async (_: unknown, value: string | undefined): Promise<void> => {
    if (!value || SOUTH_AFRICAN_ID_PATTERN.test(value)) {
        return Promise.resolve();
    }

    return Promise.reject(new Error("ID number must be exactly 13 digits."));
};

export const validateClinicianIdNumber = async (_: unknown, value: string | undefined): Promise<void> => {
    if (!value) {
        return Promise.reject(new Error("ID number is required for clinician registration."));
    }

    if (SOUTH_AFRICAN_ID_PATTERN.test(value)) {
        return Promise.resolve();
    }

    return Promise.reject(new Error("ID number must be exactly 13 digits."));
};

export const validateRegistrationNumber = async (_: unknown, value: string | undefined): Promise<void> => {
    if (!value || SOUTH_AFRICAN_REGISTRATION_PATTERN.test(value)) {
        return Promise.resolve();
    }

    return Promise.reject(new Error("Use a valid SA registration number format."));
};
