import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, typography } = medstreamTheme;

export const useAdminStyles = createStyles(({ css }) => ({
    panelCard: css`
        padding: 22px;
        border-radius: ${radius.lg}px;
    `,

    heroCard: css`
        padding: 26px;
        border-radius: ${radius.lg}px;
        border: 1px solid rgba(13, 27, 46, 0.1);
        background: linear-gradient(120deg, ${colors.navy} 0%, ${colors.navyMid} 75%);
        box-shadow: 0 18px 44px rgba(13, 27, 46, 0.22);
    `,

    heroHeading: css`
        margin: 0 0 10px !important;
        color: ${colors.white} !important;
        font-family: ${typography.fontDisplay};
    `,

    heroText: css`
        margin: 0 !important;
        color: #d2d9e5 !important;
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
        border-radius: ${radius.pill}px;
        border-color: rgba(13, 27, 46, 0.18) !important;
        margin-right: 4px;
    `,

    tableCard: css`
        overflow: hidden;
        border-color: rgba(13, 27, 46, 0.08);
        box-shadow: 0 10px 30px rgba(13, 27, 46, 0.08);
        background: #fcfaf6;

        .ant-tabs-nav::before {
            border-color: rgba(13, 27, 46, 0.12);
        }

        .ant-tabs-tab {
            color: ${colors.slate};
            font-weight: 600;
        }

        .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
            color: ${colors.amber};
        }

        .ant-tabs-ink-bar {
            background: ${colors.amber};
        }

        .ant-tabs-extra-content {
            margin-left: auto;
            padding-left: 8px;
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

        .ant-input,
        .ant-input-group-addon {
            background: ${colors.white};
        }
    `,

    filterSelect: css`
        min-width: 180px;
    `,

    assignSelect: css`
        min-width: 180px;
    `,

    primaryActionButton: css`
        min-width: 110px;
        border-radius: ${radius.pill}px !important;
        background: linear-gradient(180deg, ${colors.amberLight} 0%, ${colors.amber} 100%) !important;
        border-color: ${colors.amber} !important;
        color: ${colors.white} !important;
        font-weight: 700;
        box-shadow: 0 10px 24px rgba(224, 123, 42, 0.24);
    `,

    secondaryActionButton: css`
        min-width: 110px;
        border-radius: ${radius.pill}px !important;
        border-color: rgba(13, 27, 46, 0.2) !important;
        color: ${colors.navy} !important;
        font-weight: 700;
        background: ${colors.white} !important;
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
        background: ${colors.white};
        border: 1px solid rgba(224, 123, 42, 0.18);
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
