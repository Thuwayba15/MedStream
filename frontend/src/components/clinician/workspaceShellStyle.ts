import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius } = medstreamTheme;

export const useClinicianWorkspaceShellStyles = createStyles(({ css }) => ({
    page: css`
        width: min(85%, 1320px);
        margin: 0 auto;
        padding: 18px 0 28px;
        min-width: 0;
        box-sizing: border-box;

        @media (max-width: 1100px) {
            width: min(92%, 1180px);
        }

        @media (max-width: 768px) {
            width: 100%;
            padding-inline: 12px;
            padding: 14px 0 20px;
        }
    `,

    tabCard: css`
        border-radius: ${radius.lg}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        background: #fcfaf6;
        box-shadow: 0 10px 30px rgba(13, 27, 46, 0.08);
        overflow: hidden;
        min-height: calc(100vh - 190px);
        padding: 28px 32px 22px !important;

        .ant-tabs-nav {
            margin: 0 !important;
            padding: 0 22px;
            background: ${colors.white};
        }

        .ant-tabs-nav-wrap {
            min-width: 0;
        }

        .ant-tabs-nav::before {
            border-color: rgba(13, 27, 46, 0.12);
        }

        .ant-tabs-tab {
            color: ${colors.slate};
            font-weight: 600;
            padding-top: 14px;
            padding-bottom: 14px;
        }

        .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: ${colors.amber} !important;
        }

        .ant-tabs-ink-bar {
            background: ${colors.amber} !important;
            height: 3px !important;
            border-radius: 999px;
        }

        @media (max-width: 768px) {
            .ant-tabs-nav {
                padding: 0 14px;
            }

            .ant-tabs-nav-wrap {
                overflow-x: auto !important;
                scrollbar-width: none;
            }

            .ant-tabs-nav-wrap::-webkit-scrollbar {
                display: none;
            }

            .ant-tabs-nav-list {
                min-width: max-content;
            }

            .ant-tabs-tab {
                flex: 0 0 auto;
                padding-top: 12px;
                padding-bottom: 12px;
                padding-inline: 8px;
                font-size: 0.82rem;
            }
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
        padding: 18px 22px 22px;

        @media (max-width: 768px) {
            padding: 14px 14px 12px;
            overflow-x: clip;
        }
    `,

    loadingState: css`
        min-height: 420px;
        display: grid;
        align-content: start;
    `,
}));
