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
        grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);

        @media (max-width: 960px) {
            grid-template-columns: 1fr;
        }
    `,

    sectionCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid rgba(13, 27, 46, 0.1);
        box-shadow: ${shadows.soft};
        background: ${colors.white};
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

    chiefComplaint: css`
        margin: 0 !important;
        color: ${colors.navy};
        font-size: 1.12rem;
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
    `,

    cancelAction: css`
        border-radius: ${radius.sm}px !important;
        border-color: rgba(201, 64, 64, 0.25) !important;
        color: ${colors.urgent} !important;
        font-weight: 700;
    `,

    sideSectionTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
    `,
}));
