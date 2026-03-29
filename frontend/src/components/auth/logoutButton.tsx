"use client";

import { Button } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthActions } from "@/providers/auth";

export const LogoutButton = () => {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { logout } = useAuthActions();

    const handleLogout = async (): Promise<void> => {
        setIsLoggingOut(true);
        try {
            await logout();
        } finally {
            router.replace("/login");
            router.refresh();
        }
    };

    return (
        <Button loading={isLoggingOut} onClick={handleLogout}>
            Logout
        </Button>
    );
};
