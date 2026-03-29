"use client";

import { Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthActions } from "@/providers/auth";

interface ILogoutButtonProps {
    className?: string;
}

export const LogoutButton = ({ className }: ILogoutButtonProps) => {
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
        <Button loading={isLoggingOut} onClick={handleLogout} className={className} icon={<LogoutOutlined />}>
            Sign Out
        </Button>
    );
};
