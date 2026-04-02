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

    titleBlock: css`
        text-align: center;
        display: grid;
        gap: 8px;
        padding: 4px 0 2px;
        margin-bottom: 14px;
    `,

    title: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay} !important;
        font-size: clamp(1.9rem, 4vw, 2.7rem) !important;
    `,

    subtitle: css`
        color: ${colors.slate};
        font-weight: 500;
        font-size: 1rem;
    `,

    patientHeader: css`
        display: grid;
        gap: 8px;
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
        gap: 18px;
        padding-left: 28px;
        padding-top: 2px;

        &::before {
            content: "";
            position: absolute;
            left: 10px;
            top: 8px;
            bottom: 8px;
            width: 2px;
            border-radius: 999px;
            background: rgba(13, 27, 46, 0.12);
        }

        @media (max-width: 768px) {
            padding-left: 18px;

            &::before {
                left: 6px;
            }
        }
    `,

    timelineItem: css`
        position: relative;
    `,

    timelineDot: css`
        position: absolute;
        left: -28px;
        top: 24px;
        width: 14px;
        height: 14px;
        border-radius: 999px;
        background: ${colors.amber};
        box-shadow: 0 0 0 4px rgba(244, 164, 70, 0.18);

        @media (max-width: 768px) {
            left: -18px;
            top: 22px;
        }
    `,

    visitCard: css`
        border-radius: ${radius.lg}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        box-shadow: 0 14px 28px rgba(13, 27, 46, 0.07);
        background: #fffdf9;

        .ant-card-body {
            padding: 22px 24px !important;
        }

        @media (max-width: 768px) {
            .ant-card-body {
                padding: 18px 16px !important;
            }
        }
    `,

    visitMetaRow: css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
    `,

    visitTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay} !important;
        font-size: 1.4rem !important;

        @media (max-width: 768px) {
            font-size: 1.15rem !important;
        }
    `,

    summaryText: css`
        margin: 0 !important;
        color: ${colors.slate};
        font-size: 0.98rem;
        line-height: 1.55;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;

        @media (max-width: 768px) {
            font-size: 0.9rem;
            -webkit-line-clamp: 2;
        }
    `,
}));
