import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, shadows, typography } = medstreamTheme;

export const usePatientIntakeStyles = createStyles(({ css }) => ({
    stepCard: css`
        border-radius: ${radius.lg}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        box-shadow: ${shadows.soft};
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, ${colors.white} 100%);
        padding: 18px 22px 22px !important;
        display: grid;
        gap: 22px;
        width: min(85%, 1320px);
        min-height: 540px;
        margin: 0 auto;
        margin-inline: auto;
        justify-self: center;

        @media (max-width: 1200px) {
            width: calc(100% - 48px);
        }

        @media (max-width: 768px) {
            border-radius: ${radius.md}px;
            width: calc(100% - 24px);
            padding: 14px 14px 12px;
            min-height: 420px;
        }
    `,

    stepHeader: css`
        display: grid;
        gap: 10px;
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
        margin-top: 2px;

        .ant-typography {
            color: ${colors.navy};
            font-size: 0.82rem;
        }
    `,

    subtitleText: css`
        color: ${colors.slate};
        font-size: 1rem;
        text-align: center;
        padding-bottom: 10px;
    `,

    stepTitle: css`
        margin: 4px 0 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay} !important;
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

    checkInSection: css`
        display: grid;
        gap: 20px;
        width: 100%;
        max-width: 1080px;
        margin: 0 auto;
    `,

    checkInBanner: css`
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 18px 20px;
        border-radius: ${radius.lg}px;
        background: linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyMid} 100%);
        box-shadow: 0 18px 36px rgba(13, 27, 46, 0.14);
        color: ${colors.white};

        @media (max-width: 768px) {
            padding: 16px;
        }
    `,

    checkInBannerIcon: css`
        width: 38px;
        height: 38px;
        border-radius: ${radius.md}px;
        background: rgba(224, 123, 42, 0.16);
        display: grid;
        place-items: center;
        color: ${colors.amber};
        flex-shrink: 0;
        font-size: 1rem;
    `,

    checkInBannerText: css`
        color: rgba(255, 255, 255, 0.9) !important;
        line-height: 1.7;
        font-size: 0.94rem;
    `,

    checkInGrid: css`
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
        gap: 20px;
        align-items: stretch;

        @media (max-width: 900px) {
            grid-template-columns: 1fr;
        }
    `,

    checkInInfoCard: css`
        border-radius: ${radius.lg}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        background: ${colors.white};
        padding: 22px;
        display: grid;
        gap: 14px;
        box-shadow: 0 10px 28px rgba(13, 27, 46, 0.05);

        @media (max-width: 768px) {
            padding: 18px;
        }
    `,

    sectionEyebrow: css`
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: ${colors.amber};
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;

        &::before {
            content: "";
            width: 18px;
            height: 2px;
            background: ${colors.amber};
            border-radius: ${radius.pill}px;
        }
    `,

    checkInCardTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay} !important;
        font-size: clamp(1.45rem, 2.2vw, 1.8rem) !important;
    `,

    checkInCardText: css`
        color: ${colors.slate} !important;
        line-height: 1.7;
        font-size: 0.96rem;
    `,

    facilitySelect: css`
        width: 100%;

        .ant-select-selector {
            min-height: 52px !important;
            padding-inline: 14px !important;
            border-radius: ${radius.md}px !important;
            border-color: rgba(13, 27, 46, 0.12) !important;
            background: ${colors.offWhite} !important;
            box-shadow: none !important;
        }

        &.ant-select-focused .ant-select-selector,
        &:hover .ant-select-selector {
            border-color: rgba(224, 123, 42, 0.5) !important;
        }
    `,

    selectedFacilitySummary: css`
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px;
        border-radius: ${radius.md}px;
        background: rgba(26, 158, 110, 0.08);
        border: 1px solid rgba(26, 158, 110, 0.18);
    `,

    selectedFacilityIcon: css`
        width: 32px;
        height: 32px;
        border-radius: ${radius.pill}px;
        background: #1a9e6e;
        color: ${colors.white};
        display: grid;
        place-items: center;
        flex-shrink: 0;
    `,

    selectedFacilityLabel: css`
        display: block;
        color: rgba(26, 158, 110, 0.85) !important;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.7rem;
        font-weight: 800;
    `,

    selectedFacilityValue: css`
        display: block;
        color: #1a9e6e !important;
        font-size: 0.96rem;
        font-weight: 700;
        margin-top: 2px;
    `,

    nextStepsCard: css`
        border-radius: ${radius.lg}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        background: ${colors.white};
        padding: 22px;
        display: grid;
        gap: 16px;
        box-shadow: 0 10px 28px rgba(13, 27, 46, 0.05);

        @media (max-width: 768px) {
            padding: 18px;
        }
    `,

    nextStepsList: css`
        display: grid;
        gap: 0;
    `,

    nextStepItem: css`
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 14px 0;
        border-bottom: 1px solid rgba(13, 27, 46, 0.08);

        &:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
    `,

    nextStepItemActive: css`
        .ant-typography {
            color: ${colors.navy};
        }
    `,

    nextStepBadge: css`
        width: 28px;
        height: 28px;
        border-radius: ${radius.pill}px;
        background: rgba(138, 154, 181, 0.16);
        color: ${colors.slate};
        display: grid;
        place-items: center;
        flex-shrink: 0;
        font-family: ${typography.fontDisplay};
        font-weight: 700;
    `,

    nextStepBadgeActive: css`
        background: ${colors.amber};
        color: ${colors.white};
        box-shadow: 0 8px 20px rgba(224, 123, 42, 0.22);
    `,

    nextStepContent: css`
        display: grid;
        gap: 4px;
    `,

    nextStepTitle: css`
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        color: ${colors.navy} !important;
        font-size: 0.95rem;
        font-weight: 700;
    `,

    nextStepCurrent: css`
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: ${radius.pill}px;
        background: rgba(224, 123, 42, 0.12);
        color: ${colors.amber};
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
    `,

    nextStepDescription: css`
        color: ${colors.slate} !important;
        line-height: 1.6;
        font-size: 0.84rem;
    `,

    intakeBodyGrid: css`
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
        gap: 22px;
        align-items: start;

        @media (max-width: 980px) {
            grid-template-columns: 1fr;
        }
    `,

    intakeMainColumn: css`
        min-width: 0;
        display: grid;
        gap: 18px;
    `,

    intakeSideColumn: css`
        min-width: 0;

        @media (max-width: 980px) {
            order: 2;
        }
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

    processingOverlay: css`
        border-radius: ${radius.lg}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        background: rgba(248, 246, 242, 0.92);
        backdrop-filter: blur(6px);
        display: grid;
        place-items: center;
        text-align: center;
        gap: 10px;
        min-height: 240px;
        padding: 24px;
    `,

    processingTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay} !important;
    `,

    processingText: css`
        color: ${colors.slate} !important;
        max-width: 420px;
        line-height: 1.6;
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
        max-width: 840px;
        margin: 0 auto;
        padding: 8px 0;

        .ant-space {
            width: 100%;
        }
    `,

    questionField: css`
        width: 100%;
        padding: 18px 20px;
        border-radius: ${radius.md}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        background: ${colors.white};
        box-shadow: 0 8px 18px rgba(13, 27, 46, 0.04);
    `,

    questionLabel: css`
        color: ${colors.navy} !important;
        font-size: 0.98rem;
    `,

    questionSelect: css`
        width: 100%;

        .ant-select-selector {
            min-height: 48px !important;
            border-radius: ${radius.sm}px !important;
            padding-inline: 14px !important;
        }
    `,

    questionNumberInput: css`
        width: min(100%, 260px);

        .ant-input-number,
        &.ant-input-number {
            width: 100%;
        }
    `,

    questionTextArea: css`
        border-radius: ${radius.sm}px !important;
    `,

    statusSection: css`
        width: 100%;
        min-height: 440px;
        display: grid;
        place-items: center;
    `,

    statusGrid: css`
        width: 100%;
        max-width: 980px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
        align-items: stretch;

        @media (max-width: 900px) {
            grid-template-columns: 1fr;
        }
    `,

    statusCard: css`
        width: 100%;
        min-height: 280px;
        display: grid;
        place-items: center;
        text-align: center;
        padding: 28px 24px !important;
        border-radius: ${radius.lg}px !important;
        border: 1px solid rgba(13, 27, 46, 0.08) !important;
        box-shadow: 0 18px 36px rgba(13, 27, 46, 0.08);
        background: linear-gradient(180deg, rgba(253, 240, 228, 0.86) 0%, ${colors.white} 100%);
    `,

    queueCard: css`
        border-radius: ${radius.lg}px;
        border: 1px solid rgba(13, 27, 46, 0.12);
        background: linear-gradient(180deg, #f6f9ff 0%, #eef4ff 100%);
        padding: 28px 24px;
        display: grid;
        gap: 10px;
        text-align: center;
        width: 100%;
        min-height: 280px;
        place-items: center;
        box-shadow: 0 18px 36px rgba(13, 27, 46, 0.08);
    `,

    statusCardIcon: css`
        width: 58px;
        height: 58px;
        border-radius: ${radius.pill}px;
        display: grid;
        place-items: center;
        background: rgba(224, 123, 42, 0.14);
        color: ${colors.amber};
        font-size: 1.4rem;
    `,

    queueCardIcon: css`
        width: 58px;
        height: 58px;
        border-radius: ${radius.pill}px;
        display: grid;
        place-items: center;
        background: rgba(42, 123, 224, 0.12);
        color: #2a7be0;
        font-size: 1.4rem;
    `,

    statusCardEyebrow: css`
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
        font-weight: 800;
        color: ${colors.slate} !important;
    `,

    statusCardTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay} !important;
        font-size: clamp(1.7rem, 2.4vw, 2.2rem) !important;
    `,

    statusTag: css`
        margin: 0 !important;
        font-weight: 700;
        padding-inline: 10px;
        padding-block: 4px;
        border-radius: ${radius.pill}px;
    `,

    statusCardBody: css`
        color: ${colors.slate} !important;
        font-size: 0.98rem;
        line-height: 1.65;
        max-width: 420px;
    `,

    queueTimestamp: css`
        color: ${colors.slate} !important;
        font-size: 0.82rem;
    `,

    stickyActions: css`
        position: sticky;
        bottom: 0;
        z-index: 20;
        background: linear-gradient(180deg, rgba(252, 250, 246, 0) 0%, rgba(252, 250, 246, 0.98) 24%);
        padding-top: 10px;
        margin-top: 6px;
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
        box-shadow:
            0 0 0 3px rgba(240, 144, 64, 0.18),
            0 24px 44px rgba(13, 27, 46, 0.28) !important;
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

    urgentMessageCard: css`
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 18px;
        border-radius: ${radius.md}px;
        border: 1px solid rgba(224, 123, 42, 0.2);
        background: ${colors.amberPale};
    `,

    urgentMessageCardCritical: css`
        border-color: rgba(201, 64, 64, 0.22);
        background: rgba(201, 64, 64, 0.06);
    `,

    urgentMessageIcon: css`
        width: 34px;
        height: 34px;
        border-radius: ${radius.md}px;
        background: rgba(224, 123, 42, 0.16);
        color: ${colors.amber};
        display: grid;
        place-items: center;
        flex-shrink: 0;
    `,

    urgentMessageContent: css`
        display: grid;
        gap: 4px;
    `,

    urgentMessageTitle: css`
        color: ${colors.navy} !important;
        font-weight: 700;
    `,

    urgentMessageDescription: css`
        color: ${colors.slate} !important;
        line-height: 1.6;
    `,
}));
