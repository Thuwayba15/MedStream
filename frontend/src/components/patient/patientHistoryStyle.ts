import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, typography } = medstreamTheme;

export const usePatientHistoryStyles = createStyles(({ css }) => ({
    page: css`
        width: min(85%, 1320px);
        margin: 0 auto;
        display: grid;
        gap: 16px;
        min-height: 100%;

        @media (max-width: 1100px) {
            width: 100%;
        }
    `,

    shellCard: css`
        border-radius: ${radius.lg}px !important;
        border: 1px solid rgba(13, 27, 46, 0.08) !important;
        box-shadow: 0 22px 48px rgba(13, 27, 46, 0.12) !important;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, ${colors.white} 100%) !important;
        padding: 18px 22px 22px !important;
        min-height: 540px;

        @media (max-width: 768px) {
            padding: 14px 14px 18px !important;
            min-height: 420px;
        }
    `,

    titleBlock: css`
        text-align: center;
        display: grid;
        gap: 8px;
        padding: 8px 0 2px;
    `,

    title: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay} !important;
        font-size: clamp(2rem, 4.2vw, 3.1rem) !important;
    `,

    subtitle: css`
        color: ${colors.slate};
        font-weight: 500;
        font-size: 1rem;
    `,

    historyBody: css`
        display: grid;
        gap: 18px;
        padding-top: 4px;
    `,

    timelinePanel: css`
        border-radius: ${radius.lg}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        background: ${colors.white};
        box-shadow: 0 16px 34px rgba(13, 27, 46, 0.08);
        padding: 22px 22px 20px;
        min-height: 360px;

        @media (max-width: 768px) {
            padding: 16px 14px;
            min-height: 280px;
        }
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
    `,

    visitCard: css`
        border-radius: ${radius.lg}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        box-shadow: 0 14px 28px rgba(13, 27, 46, 0.07);
        background: #fffdf9;
        min-height: 150px;

        .ant-card-body {
            padding: 22px 24px !important;
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
        font-size: 1.5rem !important;
    `,

    visitSummary: css`
        margin: 0 !important;
        color: ${colors.slate};
        line-height: 1.7;
        font-size: 0.98rem;
    `,

    footNote: css`
        text-align: center;
        color: #8a9ab5;
        font-size: 0.92rem;
        padding: 4px 0 0;
    `,
}));
