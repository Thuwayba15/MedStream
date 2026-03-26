import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, typography } = medstreamTheme;

export const useAdminStyles = createStyles(({ css }) => ({
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
