import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, layout, radius, typography } = medstreamTheme;

export const useAuthStyles = createStyles(({ css }) => ({
    page: css`
        min-height: 100vh;
        background:
            radial-gradient(circle at top left, rgba(240, 144, 64, 0.18) 0%, rgba(240, 144, 64, 0) 30%),
            linear-gradient(155deg, ${colors.offWhite} 0%, #ffffff 45%, #f4efe6 100%);
        padding: 24px;
        display: grid;
        place-items: center;
    `,

    card: css`
        width: 100%;
        max-width: 520px;
        border-radius: ${radius.lg}px;
        border: 1px solid ${colors.borderLight};
        box-shadow: ${medstreamTheme.shadows.soft};
        background: ${colors.white};
        padding: 28px 24px;
    `,

    title: css`
        margin: 0;
        color: ${colors.navy};
        font-family: ${typography.fontDisplay};
        font-size: clamp(2rem, 4.5vw, 2.4rem);
    `,

    subtitle: css`
        margin: 8px 0 24px;
        color: ${colors.slate};
        font-size: 1rem;
        line-height: 1.6;
    `,

    form: css`
        .ant-form-item {
            margin-bottom: 16px;
        }

        .ant-input,
        .ant-input-password,
        .ant-select-selector {
            min-height: 44px;
            border-radius: 12px !important;
        }

        .ant-btn {
            min-height: 46px;
            border-radius: 12px;
            font-weight: 700;
        }
    `,

    footerText: css`
        margin-top: 16px;
        color: ${colors.slate};
        font-size: 0.95rem;
    `,

    dashboardPage: css`
        min-height: 100vh;
        background:
            radial-gradient(circle at 84% 10%, rgba(30, 49, 80, 0.11) 0%, rgba(30, 49, 80, 0) 30%),
            linear-gradient(180deg, #ffffff 0%, ${colors.offWhite} 100%);
        padding: 28px 16px;
    `,

    dashboardShell: css`
        width: 100%;
        max-width: ${layout.pageMaxWidth}px;
        margin: 0 auto;
        display: grid;
        gap: 20px;
    `,

    dashboardCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid ${colors.borderLight};
        background: ${colors.white};
        box-shadow: ${medstreamTheme.shadows.soft};
        padding: 22px;
    `,

    dashboardHeading: css`
        margin: 0 0 12px;
        color: ${colors.navy};
        font-family: ${typography.fontDisplay};
        font-size: clamp(1.8rem, 4vw, 2.2rem);
    `,

    dashboardText: css`
        margin: 0;
        color: ${colors.slate};
        line-height: 1.7;
    `,
}));
