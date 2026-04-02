"use client";

import { Form } from "antd";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { applyFieldErrors, clearFieldErrors, type LoginFormValues } from "@/lib/auth/forms";
import { useAuthActions, useAuthState } from "@/providers/auth";

const LOGIN_FIELD_NAMES: Array<keyof LoginFormValues> = ["userNameOrEmailAddress", "password"];

export const useLoginForm = () => {
    const router = useRouter();
    const [form] = Form.useForm<LoginFormValues>();
    const { login, clearError } = useAuthActions();
    const { isPending, errorMessage, fieldErrors } = useAuthState();

    useEffect(() => {
        applyFieldErrors(form, fieldErrors);
    }, [fieldErrors, form]);

    const onFinish = async (values: LoginFormValues): Promise<void> => {
        clearError();
        clearFieldErrors(form, LOGIN_FIELD_NAMES);

        try {
            const payload = await login(values);
            router.replace(payload.homePath);
        } catch {
            return;
        }
    };

    const formErrorMessage = fieldErrors.length === 0 ? errorMessage : undefined;
    const getFieldError = (fieldName: keyof LoginFormValues): string | undefined => fieldErrors.find((fieldError) => fieldError.field === fieldName)?.message;

    return {
        form,
        isPending,
        formErrorMessage,
        getFieldError,
        onFinish,
    };
};
