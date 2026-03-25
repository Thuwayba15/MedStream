"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { PropsWithChildren } from "react";
import { medstreamAntdTheme, medstreamCustomToken, ThemeProvider } from "./theme";

export function AppProviders({ children }: PropsWithChildren): React.JSX.Element {
    return (
        <AntdRegistry>
            <ThemeProvider appearance="light" theme={medstreamAntdTheme} customToken={medstreamCustomToken}>
                {children}
            </ThemeProvider>
        </AntdRegistry>
    );
}
