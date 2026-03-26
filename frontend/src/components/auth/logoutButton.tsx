"use client";

import { Button } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton(): React.JSX.Element {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async (): Promise<void> => {
        setIsLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
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
}
