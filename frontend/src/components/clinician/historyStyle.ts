import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, typography } = medstreamTheme;

export const useClinicianHistoryStyles = createStyles(({ css }) => ({
    page: css`
        display: grid;
        gap: 16px;
    `,

    sectionCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        box-shadow: 0 10px 24px rgba(13, 27, 46, 0.07);
    `,

    patientHeader: css`
        display: grid;
        gap: 8px;
    `,

    patientName: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay};
    `,

    patientMeta: css`
        color: ${colors.slate};
        font-weight: 500;
    `,

    chipRow: css`
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    `,

    listCardTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
    `,

    timelineList: css`
        position: relative;
        display: grid;
        gap: 16px;
        padding-left: 24px;

        &::before {
            content: "";
            position: absolute;
            left: 7px;
            top: 8px;
            bottom: 8px;
            width: 2px;
            border-radius: 999px;
            background: rgba(13, 27, 46, 0.12);
        }

        @media (max-width: 768px) {
            padding-left: 18px;
        }
    `,

    timelineItem: css`
        position: relative;
    `,

    timelineDot: css`
        position: absolute;
        left: -24px;
        top: 22px;
        width: 14px;
        height: 14px;
        border-radius: 999px;
        background: ${colors.amber};
        box-shadow: 0 0 0 4px rgba(244, 164, 70, 0.18);

        @media (max-width: 768px) {
            left: -18px;
        }
    `,

    visitCard: css`
        border-radius: ${radius.md}px;
        background: #fffdf9;
        border: 1px solid rgba(13, 27, 46, 0.08);
        box-shadow: 0 8px 18px rgba(13, 27, 46, 0.06);
    `,

    visitTopRow: css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
    `,

    eventMeta: css`
        color: ${colors.slate};
        font-weight: 600;
    `,

    visitTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
    `,

    summaryText: css`
        margin: 0 !important;
        color: ${colors.slate};
        font-size: 1rem;
        line-height: 1.55;
    `,
}));
