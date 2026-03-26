import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, typography } = medstreamTheme;

export const useAdminStyles = createStyles(({ css }) => ({
    panelCard: css`
        padding: 22px;
    `,

    heroCard: css`
        padding: 24px;
        border: 1px solid rgba(13, 27, 46, 0.2);
        background: linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyMid} 100%);
    `,

    heroHeading: css`
        margin: 0 0 10px !important;
        color: ${colors.white} !important;
        font-family: ${typography.fontDisplay};
    `,

    heroText: css`
        margin: 0 !important;
        color: ${colors.slateLight} !important;
    `,

    headerRow: css`
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        flex-wrap: wrap;
    `,

    headerActions: css`
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-left: auto;
    `,

    pendingBadge: css`
        font-weight: 700;
        border-radius: ${radius.sm}px;
    `,

    tableCard: css`
        overflow: hidden;
        border-color: rgba(13, 27, 46, 0.12);

        .ant-tabs-nav::before {
            border-color: rgba(13, 27, 46, 0.12);
        }

        .ant-tabs-tab {
            color: ${colors.slate};
            font-weight: 600;
        }

        .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
            color: ${colors.navy};
        }

        .ant-tabs-ink-bar {
            background: ${colors.navy};
        }
    `,

    tableWrap: css`
        width: 100%;
        overflow-x: auto;
    `,

    fullWidth: css`
        width: 100%;
    `,

    searchInput: css`
        min-width: 320px;
    `,

    filterSelect: css`
        min-width: 180px;
    `,

    assignSelect: css`
        min-width: 180px;
    `,

    facilityFormGrid: css`
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px 16px;
        width: 100%;

        @media (max-width: 1200px) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
        }
    `,

    facilityFormSection: css`
        background: ${colors.offWhite};
        border-radius: ${radius.md}px;
        padding: 18px 16px 12px 16px;
        margin-bottom: 18px;
    `,

    secondaryTextStack: css`
        .ant-typography {
            line-height: 1.4;
        }
    `,

    headingHint: css`
        color: ${colors.slate};
        font-family: ${typography.fontBody};
    `,

    stateTag: css`
        text-transform: capitalize;
    `,

    statusTag: css`
        text-transform: capitalize;
    `,
}));
