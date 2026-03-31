import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, typography } = medstreamTheme;

export const useClinicianWorkspaceShellStyles = createStyles(({ css }) => ({
    page: css`
        display: grid;
        gap: 18px;
    `,

    header: css`
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 16px;
        flex-wrap: wrap;
    `,

    title: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay};
        font-size: clamp(2rem, 4vw, 2.8rem) !important;
    `,

    subtitle: css`
        color: #7585a0;
        font-weight: 600;
    `,

    extra: css`
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
    `,

    tabCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        background: #fcfaf6;
        box-shadow: 0 10px 30px rgba(13, 27, 46, 0.08);
        overflow: hidden;

        .ant-tabs-nav {
            margin: 0 !important;
            padding: 0 20px;
            background: ${colors.white};
        }

        .ant-tabs-nav::before {
            border-color: rgba(13, 27, 46, 0.12);
        }

        .ant-tabs-tab {
            color: ${colors.slate};
            font-weight: 600;
            padding-top: 16px;
            padding-bottom: 16px;
        }

        .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: ${colors.amber} !important;
        }

        .ant-tabs-ink-bar {
            background: ${colors.amber} !important;
            height: 3px !important;
            border-radius: 999px;
        }
    `,

    tabs: css`
        .ant-tabs-content-holder {
            display: none;
        }
    `,

    tabLink: css`
        color: inherit !important;
        text-decoration: none !important;
    `,

    content: css`
        padding: 20px;

        @media (max-width: 768px) {
            padding: 16px;
        }
    `,
}));
