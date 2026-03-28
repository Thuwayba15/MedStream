import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, shadows, typography } = medstreamTheme;

export const usePatientIntakeStyles = createStyles(({ css }) => ({
    heroCard: css`
        padding: 22px 24px;
        border-radius: ${radius.md}px;
        border: 1px solid rgba(13, 27, 46, 0.2);
        background: linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyMid} 100%);
    `,

    heroTitle: css`
        margin: 0 !important;
        color: ${colors.white} !important;
        font-family: ${typography.fontDisplay};
    `,

    heroText: css`
        margin: 10px 0 0 !important;
        color: ${colors.slateLight} !important;
    `,

    stepCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid rgba(13, 27, 46, 0.1);
        box-shadow: ${shadows.soft};
        background: ${colors.white};
        padding: 20px 22px;
        display: grid;
        gap: 20px;

        @media (max-width: 768px) {
            padding: 16px;
        }
    `,

    stepHeader: css`
        display: grid;
        gap: 8px;
    `,

    progressRow: css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        color: ${colors.slate};
        font-weight: 600;
    `,

    subtitleText: css`
        color: ${colors.slate};
    `,

    stepTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay};
    `,

    panel: css`
        border-radius: ${radius.md}px;
        border: 1px solid rgba(13, 27, 46, 0.1);
        background: #f8fafc;
        padding: 16px;
    `,

    symptomTextArea: css`
        min-height: 160px !important;
        border-radius: ${radius.sm}px;
    `,

    chipsWrap: css`
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    `,

    chipButton: css`
        border-radius: ${radius.pill}px;
    `,

    extractedTag: css`
        border-radius: ${radius.pill}px;
        border: 1px solid rgba(13, 27, 46, 0.2);
        background: rgba(42, 123, 224, 0.08);
        color: ${colors.navy};
    `,

    questionList: css`
        display: grid;
        gap: 14px;
    `,

    queueCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid rgba(13, 27, 46, 0.12);
        background: linear-gradient(180deg, #f8fbff 0%, #f0f6ff 100%);
        padding: 16px;
        display: grid;
        gap: 8px;
    `,

    stickyActions: css`
        position: sticky;
        bottom: 0;
        z-index: 20;
        background: linear-gradient(180deg, rgba(248, 246, 242, 0) 0%, rgba(248, 246, 242, 0.97) 26%);
        padding-top: 14px;
    `,

    actionsRow: css`
        display: flex;
        gap: 10px;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
    `,

    primaryButton: css`
        min-width: 220px;
        border-radius: ${radius.sm}px;
        background: linear-gradient(180deg, ${colors.amberLight} 0%, ${colors.amber} 100%) !important;
        border-color: transparent !important;
        color: ${colors.white} !important;

        @media (max-width: 768px) {
            width: 100%;
        }
    `,

    secondaryButton: css`
        min-width: 130px;
        border-radius: ${radius.sm}px;

        @media (max-width: 768px) {
            width: 100%;
        }
    `,

    disabledMicButton: css`
        opacity: 0.9;
    `,
}));
