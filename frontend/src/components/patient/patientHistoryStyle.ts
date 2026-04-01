import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, typography } = medstreamTheme;

export const usePatientHistoryStyles = createStyles(({ css }) => ({
    page: css`
        width: min(85%, 1080px);
        margin: 0 auto;
        display: grid;
        gap: 20px;
        min-height: 100%;

        @media (max-width: 1100px) {
            width: 100%;
        }
    `,

    titleBlock: css`
        text-align: center;
        display: grid;
        gap: 6px;
    `,

    title: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay} !important;
    `,

    subtitle: css`
        color: ${colors.slate};
        font-weight: 500;
    `,

    timelineList: css`
        position: relative;
        display: grid;
        gap: 16px;
        padding-left: 24px;
        padding-top: 6px;

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
    `,

    visitCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        box-shadow: 0 8px 18px rgba(13, 27, 46, 0.06);
        background: #fffdf9;
    `,

    panelCard: css`
        border-radius: ${radius.lg}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, ${colors.white} 100%);
        box-shadow: 0 16px 34px rgba(13, 27, 46, 0.08);
        padding: 18px 22px 22px;

        @media (max-width: 768px) {
            padding: 14px 14px 18px;
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
    `,

    visitSummary: css`
        margin: 0 !important;
        color: ${colors.slate};
        line-height: 1.5;
    `,

    footNote: css`
        text-align: center;
        color: #8a9ab5;
        font-size: 0.92rem;
        padding: 2px 0 0;
    `,
}));
