"use client";

import { message } from "antd";
import { useEffect, useRef } from "react";

interface IToastMessageDescriptor {
    type: "success" | "error" | "warning";
    content?: string | null;
    onClose?: () => void;
}

export const useClinicianToastMessages = (messages: IToastMessageDescriptor[]): React.ReactElement => {
    const [messageApi, contextHolder] = message.useMessage();
    const lastShownRef = useRef<string[]>([]);

    useEffect(() => {
        messages.forEach((entry, index) => {
            const content = entry.content?.trim() ?? "";

            if (!content) {
                lastShownRef.current[index] = "";
                return;
            }

            if (lastShownRef.current[index] === content) {
                return;
            }

            lastShownRef.current[index] = content;
            messageApi.open({
                type: entry.type,
                content,
                duration: 4,
                onClose: entry.onClose,
            });
        });
    }, [messageApi, messages]);

    return contextHolder;
};
