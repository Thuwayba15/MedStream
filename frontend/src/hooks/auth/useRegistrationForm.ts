"use client";

import { Form } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { applyFieldErrors, clearFieldErrors, type RegistrationFormValues } from "@/lib/auth/forms";
import { useAuthActions, useAuthState } from "@/providers/auth";
import { useRegistrationActions, useRegistrationState } from "@/providers/registration";

const REGISTRATION_FIELD_NAMES: Array<keyof RegistrationFormValues> = [
    "firstName",
    "lastName",
    "emailAddress",
    "phoneNumber",
    "password",
    "confirmPassword",
    "idNumber",
    "dateOfBirth",
    "accountType",
    "professionType",
    "regulatoryBody",
    "registrationNumber",
    "requestedFacility",
    "requestedFacilityId",
];

export const useRegistrationForm = () => {
    const router = useRouter();
    const [form] = Form.useForm<RegistrationFormValues>();
    const { register, clearError } = useAuthActions();
    const { isPending, errorMessage, fieldErrors } = useAuthState();
    const { facilities, isLoading: isLoadingFacilities, errorMessage: facilityLoadError } = useRegistrationState();
    const { loadFacilities } = useRegistrationActions();
    const hasRequestedFacilitiesRef = useRef(false);
    const accountType = Form.useWatch("accountType", form) as RegistrationFormValues["accountType"] | undefined;

    useEffect(() => {
        applyFieldErrors(form, fieldErrors);
    }, [fieldErrors, form]);

    useEffect(() => {
        const shouldLoadFacilities = accountType === "Clinician" && facilities.length === 0 && !isLoadingFacilities && !hasRequestedFacilitiesRef.current;
        if (!shouldLoadFacilities) {
            return;
        }

        hasRequestedFacilitiesRef.current = true;
        void loadFacilities();
    }, [accountType, facilities.length, isLoadingFacilities, loadFacilities]);

    const facilityOptions = useMemo(
        () =>
            facilities.map((facility) => ({
                label: facility.name,
                value: facility.id,
            })),
        [facilities]
    );

    const onFinish = async (values: RegistrationFormValues): Promise<void> => {
        clearError();
        clearFieldErrors(form, REGISTRATION_FIELD_NAMES);

        try {
            const payload = await register(values);
            router.replace(payload.homePath);
        } catch {
            return;
        }
    };

    const formErrorMessage = fieldErrors.length === 0 ? errorMessage : undefined;
    const getFieldError = (fieldName: keyof RegistrationFormValues): string | undefined => fieldErrors.find((fieldError) => fieldError.field === fieldName)?.message;

    return {
        form,
        accountType,
        facilityOptions,
        isLoadingFacilities,
        facilityLoadError,
        isPending,
        formErrorMessage,
        getFieldError,
        onFinish,
    };
};
