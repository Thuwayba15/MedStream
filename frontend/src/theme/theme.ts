import { theme, type ThemeConfig } from "antd";
import { createInstance } from "antd-style";

export interface MedstreamCustomToken {
    navy: string;
    navyMid: string;
    navyLight: string;
    amber: string;
    amberLight: string;
    amberPale: string;
    amberMuted: string;
    white: string;
    offWhite: string;
    slate: string;
    slateLight: string;
    borderLight: string;
    borderNavy: string;
    urgent: string;
    priority: string;
    routine: string;
    fontBody: string;
    fontDisplay: string;
    shadowSoft: string;
    shadowPanel: string;
}

export const medstreamTheme = {
    colors: {
        navy: "#0D1B2E",
        navyMid: "#162540",
        navyLight: "#1E3150",
        amber: "#E07B2A",
        amberLight: "#F09040",
        amberPale: "#FDF0E4",
        amberMuted: "#F5D9BE",
        white: "#FFFFFF",
        offWhite: "#F8F6F2",
        slate: "#8A9AB5",
        slateLight: "#C4CFDE",
        borderLight: "rgba(224, 123, 42, 0.18)",
        borderNavy: "rgba(255, 255, 255, 0.08)",
        urgent: "#C94040",
        priority: "#E07B2A",
        routine: "#2A7BE0",
    },
    typography: {
        fontBody: "var(--font-sans)",
        fontDisplay: "var(--font-playfair)",
    },
    motion: {
        quick: "180ms",
        normal: "320ms",
        slow: "520ms",
    },
    radius: {
        sm: 14,
        md: 22,
        lg: 30,
        pill: 999,
    },
    layout: {
        pageMaxWidth: 1180,
        heroColumnMaxWidth: 540,
        panelMaxWidth: 520,
    },
    shadows: {
        soft: "0 22px 48px rgba(13, 27, 46, 0.12)",
        panel: "0 26px 70px rgba(13, 27, 46, 0.18)",
    },
} as const;

export const medstreamCustomToken: MedstreamCustomToken = {
    ...medstreamTheme.colors,
    ...medstreamTheme.typography,
    shadowSoft: medstreamTheme.shadows.soft,
    shadowPanel: medstreamTheme.shadows.panel,
};

export const medstreamAntdTheme: ThemeConfig = {
    algorithm: theme.defaultAlgorithm,
    token: {
        colorPrimary: medstreamTheme.colors.amber,
        colorInfo: medstreamTheme.colors.routine,
        colorSuccess: medstreamTheme.colors.routine,
        colorText: medstreamTheme.colors.navy,
        colorTextSecondary: medstreamTheme.colors.slate,
        colorBorder: medstreamTheme.colors.borderLight,
        colorBgBase: medstreamTheme.colors.offWhite,
        colorBgContainer: medstreamTheme.colors.white,
        fontFamily: medstreamTheme.typography.fontBody,
        borderRadius: medstreamTheme.radius.md,
    },
    components: {
        Button: {
            borderRadiusLG: medstreamTheme.radius.md,
            controlHeightLG: 56,
            fontWeight: 700,
            defaultBorderColor: medstreamTheme.colors.navy,
            defaultColor: medstreamTheme.colors.navy,
            primaryShadow: "none",
        },
        Card: {
            borderRadiusLG: medstreamTheme.radius.lg,
        },
    },
};

export const { createStyles, ThemeProvider } = createInstance<MedstreamCustomToken>({
    prefixCls: "medstream",
    customToken: medstreamCustomToken,
});
