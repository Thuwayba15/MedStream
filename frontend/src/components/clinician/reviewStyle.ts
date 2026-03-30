import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, shadows, typography } = medstreamTheme;

export const useClinicianReviewStyles = createStyles(({ css }) => ({
    page: css`
        display: grid;
        gap: 16px;
    `,

    topBar: css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    `,

    topBarLeft: css`
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
    `,

    backButton: css`
        border-radius: ${radius.sm}px !important;
    `,

    reviewTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay};
    `,

    queueBadge: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(13, 27, 46, 0.14) !important;
        background: #eef2f7 !important;
        color: #6f7f99 !important;
        font-weight: 700;
    `,

    contentGrid: css`
        display: grid;
        gap: 14px;
        grid-template-columns: minmax(0, 2fr) minmax(290px, 1fr);

        @media (max-width: 960px) {
            grid-template-columns: 1fr;
        }
    `,

    sectionCard: css`
        border-radius: ${radius.md}px;
        border: 2px solid ${colors.amberMuted};
        box-shadow: ${shadows.soft};
        background: ${colors.white};
    `,

    patientHeaderRow: css`
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 10px;
        flex-wrap: wrap;
    `,

    patientName: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay};
    `,

    metaRow: css`
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        color: #7f90ad;
        font-weight: 600;
    `,

    chiefComplaintCard: css`
        background: #f7f5f2;
        border-radius: ${radius.sm}px;
        border: 1px solid rgba(13, 27, 46, 0.08);
    `,

    fieldLabel: css`
        color: #8190a9;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.74rem;
    `,

    chiefComplaint: css`
        margin: 6px 0 0 !important;
        color: ${colors.navy};
        font-size: 1.15rem;
        font-weight: 700;
    `,

    bodyText: css`
        color: #4f5f78;
        margin: 0 !important;
    `,

    symptomWrap: css`
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    `,

    summaryPanel: css`
        padding: 14px 16px;
        border-radius: ${radius.sm}px;
        border: 2px solid ${colors.amberMuted};
        background: ${colors.white};
        box-shadow:
            0 0 8px 2px ${colors.amber}80,
            0 0 0 0 ${colors.amber};
        animation: summaryGlow 1.8s infinite alternate;
    `,

    "@keyframes summaryGlow": {
        from: {
            boxShadow: `0 0 8px 2px ${colors.amberMuted}80, 0 0 0 0 ${colors.amberMuted}`,
        },
        to: {
            boxShadow: `0 0 16px 6px ${colors.amberMuted}cc, 0 0 0 0 ${colors.amberMuted}`,
        },
    },

    followUpList: css`
        display: grid;
        gap: 8px;
    `,

    followUpItem: css`
        display: grid;
        gap: 2px;
        padding: 8px 10px;
        border-radius: ${radius.sm}px;
        background: #f8fafc;
        border: 1px solid rgba(13, 27, 46, 0.08);
    `,

    followUpLabel: css`
        color: #73839d;
        font-size: 0.8rem;
        font-weight: 700;
    `,

    followUpValue: css`
        color: ${colors.navy};
        font-weight: 600;
    `,

    urgencyUrgent: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(201, 64, 64, 0.32) !important;
        background: rgba(201, 64, 64, 0.12) !important;
        color: ${colors.urgent} !important;
        font-weight: 700;
    `,

    urgencyPriority: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(224, 123, 42, 0.32) !important;
        background: rgba(224, 123, 42, 0.12) !important;
        color: ${colors.priority} !important;
        font-weight: 700;
    `,

    urgencyRoutine: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(42, 123, 224, 0.3) !important;
        background: rgba(42, 123, 224, 0.1) !important;
        color: ${colors.routine} !important;
        font-weight: 700;
    `,

    statusTag: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(13, 27, 46, 0.2) !important;
        background: rgba(13, 27, 46, 0.08) !important;
        color: ${colors.navy} !important;
        font-weight: 700;
        text-transform: uppercase;
    `,

    actionStack: css`
        width: 100%;
        display: grid;
        gap: 10px;
    `,

    primaryAction: css`
        border-radius: ${radius.sm}px !important;
        background: linear-gradient(180deg, ${colors.navyLight} 0%, ${colors.navy} 100%) !important;
        border-color: ${colors.navy} !important;
        font-weight: 700;
    `,

    secondaryAction: css`
        border-radius: ${radius.sm}px !important;
        font-weight: 700;
        border-color: rgba(13, 27, 46, 0.16) !important;
        color: ${colors.navy} !important;
        background: ${colors.white} !important;
    `,

    centeredAction: css`
        justify-content: center !important;
        font-weight: 700;
    `,

    assessmentIconWrap: css`
        width: 72px;
        height: 72px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        font-size: 1.75rem;
    `,

    assessmentIconUrgent: css`
        color: ${colors.urgent};
        background: rgba(201, 64, 64, 0.1);
    `,

    assessmentIconPriority: css`
        color: ${colors.priority};
        background: rgba(224, 123, 42, 0.12);
    `,

    assessmentIconRoutine: css`
        color: ${colors.routine};
        background: rgba(42, 123, 224, 0.12);
    `,

    sideSectionTitle: css`
        margin: 0 !important;
        color: #7486a7 !important;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        font-size: 0.78rem !important;
    `,

    assessmentUrgency: css`
        margin: 0 !important;
        font-family: ${typography.fontDisplay};
    `,

    assessmentUrgent: css`
        color: ${colors.urgent} !important;
    `,

    assessmentPriority: css`
        color: ${colors.priority} !important;
    `,

    assessmentRoutine: css`
        color: ${colors.routine} !important;
    `,

    redFlagList: css`
        display: grid;
        gap: 8px;
    `,

    redFlagItem: css`
        display: flex;
        align-items: flex-start;
        gap: 8px;
    `,

    redDot: css`
        width: 7px;
        height: 7px;
        margin-top: 8px;
        border-radius: 999px;
        flex-shrink: 0;
    `,

    reasoningDotUrgent: css`
        background: ${colors.urgent};
    `,

    reasoningDotPriority: css`
        background: ${colors.priority};
    `,

    reasoningDotRoutine: css`
        background: ${colors.routine};
    `,
}));
