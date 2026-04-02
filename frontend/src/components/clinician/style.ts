import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, shadows, typography } = medstreamTheme;

export const useClinicianQueueStyles = createStyles(({ css }) => ({
    queuePage: css`
        display: grid;
        gap: 18px;
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
        min-height: 132px;
        display: flex;
        align-items: center;
        gap: 14px;
        position: relative;
        overflow: hidden;
        transition:
            transform 180ms ease,
            box-shadow 180ms ease;

        &::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            opacity: 1;
        }

        &:hover {
            transform: translateY(-2px);
        }
    `,

    summaryNeutral: css`
        border-color: rgba(13, 27, 46, 0.1);
        background: linear-gradient(180deg, rgba(13, 27, 46, 0.03) 0%, ${colors.white} 72%);

        &::after {
            background: ${colors.navy};
        }
    `,

    summaryWarning: css`
        border-color: rgba(224, 123, 42, 0.25);
        background: linear-gradient(180deg, rgba(224, 123, 42, 0.08) 0%, ${colors.white} 72%);

        &::after {
            background: ${colors.priority};
        }
    `,

    summaryDanger: css`
        border-color: rgba(201, 64, 64, 0.25);
        background: linear-gradient(180deg, rgba(201, 64, 64, 0.08) 0%, ${colors.white} 72%);

        &::after {
            background: ${colors.urgent};
        }
    `,

    summarySuccess: css`
        border-color: rgba(35, 160, 112, 0.25);
        background: linear-gradient(180deg, rgba(35, 160, 112, 0.08) 0%, ${colors.white} 72%);

        &::after {
            background: #198a60;
        }
    `,

    summaryIconWrap: css`
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        font-size: 1.1rem;
        background: rgba(13, 27, 46, 0.06);
        color: ${colors.navy};
    `,

    summaryIconNeutral: css`
        background: rgba(13, 27, 46, 0.08);
        color: ${colors.navy};
    `,

    summaryIconWarning: css`
        background: rgba(224, 123, 42, 0.14);
        color: ${colors.priority};
    `,

    summaryIconDanger: css`
        background: rgba(201, 64, 64, 0.14);
        color: ${colors.urgent};
    `,

    summaryIconSuccess: css`
        background: rgba(35, 160, 112, 0.14);
        color: #198a60;
    `,

    summaryInfo: css`
        display: grid;
        gap: 4px;
        min-width: 0;
    `,

    summaryLabel: css`
        color: #7f90ad;
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
    `,

    summaryValue: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay};
        font-size: clamp(1.8rem, 3vw, 2.4rem) !important;
        line-height: 1 !important;
    `,

    summarySuffix: css`
        font-size: 0.95rem;
        margin-left: 3px;
        font-family: ${typography.fontBody};
        font-weight: 700;
    `,

    summaryHint: css`
        color: ${colors.slate};
        font-size: 0.9rem;
    `,

    filterCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid rgba(13, 27, 46, 0.1);
        background: #fcfaf6;
        box-shadow: 0 10px 22px rgba(13, 27, 46, 0.08);
    `,

    filterTopRow: css`
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: space-between;

        @media (max-width: 768px) {
            align-items: stretch;
        }
    `,

    filterGroup: css`
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;

        @media (max-width: 768px) {
            width: 100%;
            align-items: stretch;

            .ant-segmented {
                width: 100%;
            }

            .ant-segmented-group {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
                width: 100%;
            }
        }
    `,

    searchInput: css`
        flex: 1 1 300px;
        min-width: 220px;

        .ant-input-affix-wrapper {
            border-color: rgba(13, 27, 46, 0.18) !important;
            border-radius: ${radius.sm}px !important;
            min-height: 48px;
        }
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
        grid-template-columns: 92px minmax(0, 1fr) 152px;
        border: 1px solid rgba(13, 27, 46, 0.1);
        border-radius: ${radius.md}px;
        overflow: hidden;
        background: ${colors.white};
        position: relative;
        --queue-accent: ${colors.routine};

        &::before {
            content: "";
            position: absolute;
            inset: 0 auto 0 0;
            width: 6px;
            background: var(--queue-accent);
            z-index: 1;
        }

        @media (max-width: 1240px) {
            grid-template-columns: 86px 1fr;
        }

        @media (max-width: 640px) {
            grid-template-columns: 1fr;
        }
    `,

    rowUrgent: css`
        --queue-accent: ${colors.urgent};
    `,

    rowPriority: css`
        --queue-accent: ${colors.priority};
    `,

    rowRoutine: css`
        --queue-accent: ${colors.routine};
    `,

    queueNumberBlock: css`
        background: #f6f2ef;
        border-right: 1px solid rgba(13, 27, 46, 0.08);
        display: grid;
        place-content: center;
        gap: 4px;
        min-height: 126px;
        text-align: center;
        padding-left: 6px;

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
        padding: 14px 16px 14px 18px;
        display: grid;
        gap: 8px;
        min-width: 0;
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
        font-size: clamp(1.25rem, 2.8vw, 1.65rem);
        word-break: break-word;
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
        min-width: 0;

        a {
            width: 100%;
        }

        @media (max-width: 1240px) {
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

    paginationRow: css`
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;

        @media (max-width: 640px) {
            justify-content: center;
        }
    `,
}));
