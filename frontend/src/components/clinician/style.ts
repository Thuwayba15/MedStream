import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, shadows, typography } = medstreamTheme;

export const useClinicianQueueStyles = createStyles(({ css }) => ({
    queuePage: css`
        display: grid;
        gap: 18px;
    `,

    pageHeader: css`
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
    `,

    eyebrow: css`
        color: ${colors.amber};
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.75rem;
        font-weight: 700;
    `,

    pageTitle: css`
        margin: 6px 0 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay};
        font-size: clamp(2rem, 4.2vw, 3rem) !important;
    `,

    liveTag: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(35, 160, 112, 0.35) !important;
        background: rgba(35, 160, 112, 0.12) !important;
        color: #198a60 !important;
        font-weight: 700;
        font-size: 0.92rem;
        padding: 6px 12px !important;
    `,

    summaryGrid: css`
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(4, minmax(0, 1fr));

        @media (max-width: 1080px) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @media (max-width: 640px) {
            grid-template-columns: 1fr;
        }
    `,

    summaryCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid rgba(13, 27, 46, 0.1);
        box-shadow: ${shadows.soft};
        background: ${colors.white};
        min-height: 120px;

        .ant-statistic-title {
            color: #7f90ad;
            font-size: 0.82rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-weight: 700;
        }

        .ant-statistic-content {
            color: ${colors.navy};
            font-family: ${typography.fontDisplay};
            font-size: clamp(1.7rem, 3vw, 2.4rem);
        }
    `,

    summaryNeutral: css`
        border-color: rgba(13, 27, 46, 0.1);
    `,

    summaryWarning: css`
        border-color: rgba(224, 123, 42, 0.25);

        .ant-statistic-content {
            color: ${colors.priority};
        }
    `,

    summaryDanger: css`
        border-color: rgba(201, 64, 64, 0.25);

        .ant-statistic-content {
            color: ${colors.urgent};
        }
    `,

    summarySuccess: css`
        border-color: rgba(35, 160, 112, 0.25);

        .ant-statistic-content {
            color: #198a60;
        }
    `,

    filterCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid rgba(13, 27, 46, 0.1);
        background: #fcfaf6;
        box-shadow: 0 10px 22px rgba(13, 27, 46, 0.08);
    `,

    filterTopRow: css`
        display: grid;
        grid-template-columns: minmax(220px, 1fr) auto;
        gap: 10px;

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
        }
    `,

    refreshButton: css`
        border-radius: ${radius.sm}px !important;
        min-width: 132px;
        background: linear-gradient(180deg, ${colors.navyLight} 0%, ${colors.navy} 100%) !important;
        border-color: ${colors.navy} !important;
    `,

    filterBottomRow: css`
        display: grid;
        gap: 12px;
        margin-top: 12px;
    `,

    filterLabel: css`
        color: #7f90ad;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
        font-size: 0.78rem;
    `,

    liveQueueSection: css`
        display: grid;
        gap: 12px;
    `,

    liveQueueHeader: css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
    `,

    liveQueueTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay};
    `,

    queueCard: css`
        border-radius: ${radius.md}px;
        border-color: rgba(13, 27, 46, 0.08);
    `,

    queueList: css`
        display: grid;
        gap: 12px;
    `,

    queueItem: css`
        display: grid;
        grid-template-columns: 92px minmax(280px, 1fr) 170px;
        border: 1px solid rgba(13, 27, 46, 0.1);
        border-radius: ${radius.md}px;
        overflow: hidden;
        background: ${colors.white};

        @media (max-width: 980px) {
            grid-template-columns: 86px 1fr;
        }

        @media (max-width: 640px) {
            grid-template-columns: 1fr;
        }
    `,

    rowUrgent: css`
        box-shadow: inset 4px 0 0 ${colors.urgent};
    `,

    rowPriority: css`
        box-shadow: inset 4px 0 0 ${colors.priority};
    `,

    rowRoutine: css`
        box-shadow: inset 4px 0 0 ${colors.routine};
    `,

    queueNumberBlock: css`
        background: #f6f2ef;
        border-right: 1px solid rgba(13, 27, 46, 0.08);
        display: grid;
        place-content: center;
        gap: 4px;
        min-height: 126px;
        text-align: center;

        @media (max-width: 640px) {
            min-height: 64px;
            grid-template-columns: auto auto;
            align-items: baseline;
            justify-content: center;
            gap: 10px;
            border-right: none;
            border-bottom: 1px solid rgba(13, 27, 46, 0.08);
        }
    `,

    queueNumberLabel: css`
        color: #8f9db6;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.74rem;
        font-weight: 700;
    `,

    queueNumberValue: css`
        color: ${colors.navy};
        font-size: 2rem;
        font-family: ${typography.fontDisplay};
        line-height: 1;
    `,

    patientBlock: css`
        padding: 14px 16px;
        display: grid;
        gap: 8px;
    `,

    rowTitleWrap: css`
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    `,

    patientName: css`
        margin: 0 8px 0 0 !important;
        color: ${colors.navy} !important;
        font-size: 1.65rem;
    `,

    clinicalPreview: css`
        margin: 0 !important;
        color: #4f5f78;
        font-size: 1rem;
    `,

    detailRow: css`
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
        color: #8797b1;
        font-weight: 600;
    `,

    actionPanel: css`
        border-left: 1px solid rgba(13, 27, 46, 0.08);
        padding: 14px 12px;
        display: grid;
        justify-items: center;
        align-content: center;
        gap: 10px;

        @media (max-width: 980px) {
            grid-column: 1 / -1;
            border-left: none;
            border-top: 1px solid rgba(13, 27, 46, 0.08);
            justify-items: stretch;
            grid-template-columns: 1fr auto;
            align-items: center;
        }

        @media (max-width: 640px) {
            grid-template-columns: 1fr;
            justify-items: stretch;
        }
    `,

    primaryAction: css`
        border-radius: ${radius.sm}px !important;
        background: linear-gradient(180deg, ${colors.navyLight} 0%, ${colors.navy} 100%) !important;
        border-color: ${colors.navy} !important;
        color: ${colors.white} !important;
        font-weight: 700;
        min-width: 108px;
    `,

    badgeUrgent: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(201, 64, 64, 0.32);
        background: rgba(201, 64, 64, 0.12);
        color: ${colors.urgent};
        font-weight: 700;
    `,

    badgePriority: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(224, 123, 42, 0.32);
        background: rgba(224, 123, 42, 0.12);
        color: ${colors.priority};
        font-weight: 700;
    `,

    badgeRoutine: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(42, 123, 224, 0.3);
        background: rgba(42, 123, 224, 0.1);
        color: ${colors.routine};
        font-weight: 700;
    `,

    statusWaiting: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(13, 27, 46, 0.2);
        background: rgba(13, 27, 46, 0.08);
        color: ${colors.navy};
        font-weight: 700;
        text-transform: uppercase;
    `,

    statusCalled: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(35, 160, 112, 0.32);
        background: rgba(35, 160, 112, 0.12);
        color: #198a60;
        font-weight: 700;
        text-transform: uppercase;
    `,

    statusInConsult: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(42, 123, 224, 0.3);
        background: rgba(42, 123, 224, 0.1);
        color: ${colors.routine};
        font-weight: 700;
        text-transform: uppercase;
    `,

    loadingWrap: css`
        display: grid;
        gap: 10px;
    `,
}));

