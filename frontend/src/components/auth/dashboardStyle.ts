import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, layout, radius, typography } = medstreamTheme;

export const useAuthDashboardStyles = createStyles(({ css }) => ({
    dashboardPage: css`
        min-height: 100vh;
        background: radial-gradient(circle at 84% 10%, rgba(30, 49, 80, 0.11) 0%, rgba(30, 49, 80, 0) 30%), linear-gradient(180deg, #ffffff 0%, ${colors.offWhite} 100%);
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
