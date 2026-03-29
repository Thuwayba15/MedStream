import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, shadows, typography } = medstreamTheme;

export const usePatientIntakeStyles = createStyles(({ css }) => ({
    stepCard: css`
        border-radius: ${radius.lg}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        box-shadow: ${shadows.soft};
        background: {colors.offWhite};
        padding: 20px 26px 16px;
        display: grid;
        gap: 18px;
        width: 80%;
        min-height: 540px;
        /* Adjust min-height as needed for your tallest step */
        margin: 0 auto;

        @media (max-width: 768px) {
            border-radius: ${radius.md}px;
            padding: 14px 14px 12px;
            min-height: 420px;
        }
    `,

    stepHeader: css`
        display: grid;
        gap: 8px;
        text-align: center;
    `,

    progressRow: css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        color: ${colors.amber};
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    `,

    subtitleText: css`
        color: ${colors.slate};
        font-size: 1.05rem;
        text-align: center;
    `,

    stepTitle: css`
        margin: 4px 0 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay};
        text-align: center;
        font-size: clamp(2rem, 4.2vw, 3.1rem) !important;
    `,

    panel: css`
        border-radius: ${radius.lg}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        background: ${colors.white};
        padding: 18px;
        width: 100%;
        max-width: 820px;
        margin: 0 auto;
    `,

    centeredBlock: css`
        width: 100%;
        max-width: 860px;
        margin: 0 auto;
    `,

    centeredWrap: css`
        display: flex;
        justify-content: center;
    `,

    centeredText: css`
        text-align: center;
    `,

    facilitySelect: css`
        width: min(560px, 100%);
    `,

    symptomTextArea: css`
        min-height: 130px !important;
        border-radius: ${radius.md}px;
        border-color: rgba(138, 154, 181, 0.25) !important;
        background: #fafcff;

        .ant-input {
            color: ${colors.navy} !important;
            font-size: 1.05rem;
        }
    `,

    chipsWrap: css`
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
    `,

    symptomChipTitle: css`
        display: block;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #7e8fad;
        text-align: center;
    `,

    chipButton: css`
        border-radius: ${radius.pill}px !important;
        height: 42px;
        padding-inline: 20px;
        border-color: rgba(138, 154, 181, 0.28);
        color: #4f5f78;
        font-weight: 700;
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
        width: 100%;
        max-width: 740px;
        margin: 0 auto;
        padding: 8px 0;

        .ant-space {
            width: 100%;
        }
    `,

    statusCard: css`
        width: 100%;
        max-width: 620px;
        margin: 0 auto;
    `,

    queueCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid rgba(13, 27, 46, 0.12);
        background: linear-gradient(180deg, #f8fbff 0%, #f0f6ff 100%);
        padding: 16px;
        display: grid;
        gap: 8px;
        text-align: center;
        width: 100%;
        max-width: 620px;
        margin: 0 auto;
    `,

    stickyActions: css`
        position: sticky;
        bottom: 0;
        z-index: 20;
        background: linear-gradient(180deg, rgba(252, 250, 246, 0) 0%, rgba(252, 250, 246, 0.98) 24%);
        padding-top: 10px;
        margin-top: 6px;
    `,

    bottomNavWrap: css`
        padding: 10px 8px 12px;
        border-top: 1px solid rgba(138, 154, 181, 0.2);
        border-bottom: 1px solid rgba(138, 154, 181, 0.2);
        margin-bottom: 14px;
        width: 100%;

        .ant-segmented {
            background: transparent;
        }

        .ant-segmented-item-label {
            min-height: 42px;
            display: grid;
            place-items: center;
            font-weight: 700;
            color: #8091af;
        }

        .ant-segmented-item-selected {
            background: rgba(240, 144, 64, 0.16) !important;
            color: ${colors.amber} !important;
            border-radius: ${radius.sm}px;
        }
    `,

    actionsRow: css`
        display: flex;
        gap: 12px;
        justify-content: space-between;
        align-items: center;
        flex-wrap: nowrap;

        @media (max-width: 768px) {
            flex-wrap: wrap;
        }
    `,

    primaryButton: css`
        min-width: 240px;
        height: 52px;
        border-radius: ${radius.sm}px !important;
        background: linear-gradient(180deg, ${colors.amberLight} 0%, ${colors.amber} 100%) !important;
        border-color: ${colors.amber} !important;
        color: ${colors.white} !important;
        box-shadow: 0 12px 28px rgba(224, 123, 42, 0.36);
        font-weight: 800;

        @media (max-width: 768px) {
            width: 100%;
        }
    `,

    secondaryButton: css`
        min-width: 130px;
        height: 52px;
        border-radius: ${radius.sm}px !important;
        border-color: rgba(138, 154, 181, 0.34);
        color: #425675;
        font-weight: 700;

        @media (max-width: 768px) {
            width: 100%;
        }
    `,

    disabledMicButton: css`
        width: 100%;
        min-height: 210px;
        border-radius: ${radius.lg}px !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        background: radial-gradient(circle at 75% 0%, rgba(240, 144, 64, 0.2) 0%, rgba(240, 144, 64, 0) 42%), linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyMid} 100%) !important;
        color: ${colors.white} !important;
        font-size: 1.9rem;
        font-family: ${typography.fontDisplay};
        box-shadow: 0 20px 40px rgba(13, 27, 46, 0.2);

        .ant-btn-icon {
            width: 88px;
            height: 88px;
            border-radius: ${radius.pill}px;
            display: grid;
            place-items: center;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(240, 144, 64, 0.5);
        }

        .anticon {
            color: ${colors.amberLight};
            font-size: 2rem;
        }

        &:hover,
        &:focus {
            color: ${colors.white} !important;
            border-color: rgba(255, 255, 255, 0.18) !important;
            background: radial-gradient(circle at 75% 0%, rgba(240, 144, 64, 0.26) 0%, rgba(240, 144, 64, 0) 45%), linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyMid} 100%) !important;
        }
    `,

    listeningMicButton: css`
        box-shadow: 0 0 0 3px rgba(240, 144, 64, 0.18), 0 24px 44px rgba(13, 27, 46, 0.28) !important;
    `,

    micButtonContent: css`
        display: grid;
        place-items: center;
        gap: 16px;
        width: 100%;
        font-size: 2rem;
    `,

    micOrb: css`
        width: 88px;
        height: 88px;
        border-radius: ${radius.pill}px;
        display: grid;
        place-items: center;
        position: relative;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(240, 144, 64, 0.5);
    `,

    micPulse: css`
        position: absolute;
        inset: -8px;
        border-radius: ${radius.pill}px;
        border: 2px solid rgba(240, 144, 64, 0.45);
        animation: medstreamPulse 1.2s ease-out infinite;
        pointer-events: none;

        @keyframes medstreamPulse {
            0% {
                transform: scale(0.86);
                opacity: 0.85;
            }
            100% {
                transform: scale(1.2);
                opacity: 0;
            }
        }
    `,

    orDivider: css`
        text-transform: lowercase;
        letter-spacing: 0.08em;
        font-weight: 700;
        color: #90a0bb;
        text-align: center;
        display: block;
        width: 100%;
    `,
}));
