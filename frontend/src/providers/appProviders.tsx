"use client";

import type { PropsWithChildren } from "react";
import { AuthProvider } from "@/providers/auth";
import { medstreamAntdTheme, medstreamCustomToken, ThemeProvider } from "../theme/theme";

export const AppProviders = ({ children }: PropsWithChildren) => {
    return (
        <ThemeProvider appearance="light" theme={medstreamAntdTheme} customToken={medstreamCustomToken}>
            <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
    );
};
