import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, shadows, typography } = medstreamTheme;

export const useClinicianConsultationStyles = createStyles(({ css }) => ({
    page: css`
        display: grid;
        gap: 18px;
    `,
    topBar: css`
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        flex-wrap: wrap;

        @media (max-width: 768px) {
            gap: 12px;
        }
    `,
    topBarLeft: css`
        display: flex;
        align-items: flex-start;
        gap: 12px;
        flex-wrap: wrap;
    `,
    backButton: css`
        border-radius: ${radius.sm}px !important;
        margin-top: 2px;
    `,
    pageTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay};
        word-break: break-word;

        @media (max-width: 768px) {
            font-size: 1.85rem !important;
            line-height: 1.1 !important;
        }
    `,
    pageMeta: css`
        color: #7d8ca4;
        font-weight: 600;
    `,
    topActions: css`
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;

        @media (max-width: 768px) {
            width: 100%;

            > * {
                flex: 1 1 calc(50% - 8px);
            }
        }
    `,
    secondaryAction: css`
        border-radius: ${radius.sm}px !important;
        font-weight: 700;
        border-color: rgba(13, 27, 46, 0.16) !important;
        color: ${colors.navy} !important;
        background: ${colors.white} !important;
    `,
    primaryAction: css`
        border-radius: ${radius.sm}px !important;
        background: linear-gradient(180deg, ${colors.navyLight} 0%, ${colors.navy} 100%) !important;
        border-color: ${colors.navy} !important;
        color: ${colors.white} !important;
        font-weight: 700;

        &:disabled,
        &.ant-btn-primary:disabled,
        &.ant-btn-color-primary[disabled] {
            color: ${colors.white} !important;
            background: ${colors.navyMid} !important;
            border-color: ${colors.navyMid} !important;
            opacity: 0.9;
        }
    `,
    signalAction: css`
        border-radius: ${radius.sm}px !important;
        background: linear-gradient(180deg, ${colors.amberLight} 0%, ${colors.amber} 100%) !important;
        border-color: ${colors.amber} !important;
        color: ${colors.white} !important;
        font-weight: 700;
        box-shadow: 0 10px 24px rgba(224, 123, 42, 0.2);
        min-height: 40px;
    `,
    micAction: css`
        border-radius: ${radius.sm}px !important;
        min-width: 40px;
        height: 40px;
        border-color: rgba(13, 27, 46, 0.16) !important;
        color: ${colors.navy} !important;
        background: ${colors.white} !important;
    `,
    shellGrid: css`
        display: grid;
        gap: 18px;
        grid-template-columns: minmax(300px, 348px) minmax(0, 1fr);
        align-items: start;

        @media (max-width: 1080px) {
            grid-template-columns: 1fr;
        }

        @media (max-width: 768px) {
            gap: 14px;
        }
    `,
    sideRail: css`
        display: grid;
        gap: 14px;
        position: sticky;
        top: 96px;

        @media (max-width: 1080px) {
            position: static;
        }

        @media (max-width: 768px) {
            gap: 12px;
        }
    `,
    panelCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid rgba(224, 123, 42, 0.18);
        box-shadow: ${shadows.soft};
        background: ${colors.white};
        overflow: hidden;

        @media (max-width: 768px) {
            border-radius: 20px;
        }
    `,
    sectionHeading: css`
        margin: 0 0 12px !important;
        color: #8998b1 !important;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.78rem !important;
    `,
    patientCard: css`
        display: grid;
        gap: 14px;
    `,
    patientSummaryBox: css`
        padding: 16px 18px;
        border-radius: ${radius.sm}px;
        background: linear-gradient(180deg, #fffdfa 0%, #f8f3ec 100%);
        border: 1px solid rgba(224, 123, 42, 0.18);

        @media (max-width: 768px) {
            padding: 14px;
        }
    `,
    patientSummaryLead: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-size: 1.25rem;
        font-weight: 700;
    `,
    patientSummaryText: css`
        margin: 6px 0 0 !important;
        color: #7889a5;
        white-space: pre-line;
    `,
    tagRow: css`
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    `,
    patientContextHeader: css`
        display: grid;
        gap: 10px;
        margin-bottom: 14px;
    `,
    queueTag: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(13, 27, 46, 0.15) !important;
        background: rgba(13, 27, 46, 0.06) !important;
        color: ${colors.navy} !important;
        font-weight: 700;
    `,
    urgencyUrgent: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(201, 64, 64, 0.28) !important;
        background: rgba(201, 64, 64, 0.12) !important;
        color: ${colors.urgent} !important;
        font-weight: 700;
    `,
    urgencyPriority: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(224, 123, 42, 0.3) !important;
        background: rgba(224, 123, 42, 0.12) !important;
        color: ${colors.priority} !important;
        font-weight: 700;
    `,
    urgencyRoutine: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(42, 123, 224, 0.28) !important;
        background: rgba(42, 123, 224, 0.12) !important;
        color: ${colors.routine} !important;
        font-weight: 700;
    `,
    summaryGlow: css`
        padding: 14px 16px;
        border-radius: ${radius.sm}px;
        background: ${colors.white};
        border: 1px solid ${colors.amberMuted};
        box-shadow:
            0 0 0 1px rgba(224, 123, 42, 0.06),
            0 20px 36px rgba(224, 123, 42, 0.12);
    `,
    bodyText: css`
        color: #50617b;
        margin: 0 !important;
        white-space: pre-line;
    `,
    reasoningList: css`
        display: grid;
        gap: 8px;
    `,
    reasoningItem: css`
        display: flex;
        align-items: flex-start;
        gap: 8px;
        color: #50617b;
    `,
    dot: css`
        width: 8px;
        height: 8px;
        margin-top: 8px;
        border-radius: 999px;
        background: ${colors.amber};
        flex-shrink: 0;
    `,
    metricStack: css`
        display: grid;
        gap: 10px;
    `,
    metricRow: css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        border-radius: ${radius.sm}px;
        background: #fbfaf8;
        border: 1px solid rgba(13, 27, 46, 0.08);
    `,
    metricRowAlert: css`
        background: rgba(201, 64, 64, 0.06);
        border-color: rgba(201, 64, 64, 0.16);
    `,
    metricLabel: css`
        color: #8190a9;
        font-weight: 700;
    `,
    metricValue: css`
        color: ${colors.navy};
        font-weight: 800;
    `,
    transcriptMeta: css`
        color: #7d8ca4;
        font-size: 0.9rem;
    `,
    capturePanel: css`
        display: grid;
        gap: 12px;
        padding: 14px 16px;
        margin-bottom: 14px;
        border-radius: ${radius.sm}px;
        border: 1px solid rgba(224, 123, 42, 0.18);
        background: linear-gradient(180deg, #fffdfa 0%, #f8f3ec 100%);
    `,
    captureHeader: css`
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        flex-wrap: wrap;
    `,
    recordingTag: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(201, 64, 64, 0.28) !important;
        background: rgba(201, 64, 64, 0.12) !important;
        color: ${colors.urgent} !important;
        font-weight: 700;
    `,
    cardTitleRow: css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    `,
    mainColumn: css`
        display: grid;
        gap: 14px;

        @media (max-width: 768px) {
            gap: 12px;
        }
    `,
    workflowSteps: css`
        .ant-steps-item {
            min-height: 54px;
        }

        .ant-steps-item-content {
            min-height: auto !important;
        }

        .ant-steps-item-title {
            color: ${colors.navy} !important;
            font-weight: 700;
        }

        .ant-steps-item-description,
        .ant-steps-item-content {
            color: #73839d !important;
        }

        .ant-steps-item-process .ant-steps-item-icon {
            background: ${colors.amber} !important;
            border-color: ${colors.amber} !important;
        }

        .ant-steps-item-process .ant-steps-icon,
        .ant-steps-item-wait .ant-steps-icon {
            color: ${colors.white} !important;
        }

        .ant-steps-item-finish .ant-steps-item-icon {
            background: rgba(35, 160, 112, 0.12) !important;
            border-color: rgba(35, 160, 112, 0.2) !important;
        }

        .ant-steps-item-finish .ant-steps-icon {
            color: #198a60 !important;
        }
    `,
    aiBanner: css`
        border-radius: 28px;
        overflow: hidden;
        border: none !important;
        background: linear-gradient(90deg, ${colors.navy} 0%, #142844 62%, #19365c 100%) !important;
        box-shadow: 0 26px 50px rgba(13, 27, 46, 0.18);
    `,
    aiBannerInner: css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    `,
    aiBannerLead: css`
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
    `,
    aiIconWrap: css`
        width: 54px;
        height: 54px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: rgba(224, 123, 42, 0.22);
        color: ${colors.amber};
        font-size: 1.3rem;
        flex-shrink: 0;
    `,
    aiBannerTitle: css`
        margin: 0 !important;
        color: ${colors.white} !important;
    `,
    aiBannerText: css`
        color: ${colors.slateLight} !important;
        margin: 2px 0 0 !important;
    `,
    bannerButton: css`
        min-width: 176px;
        border-radius: ${radius.pill}px !important;
        background: linear-gradient(180deg, ${colors.amberLight} 0%, ${colors.amber} 100%) !important;
        border: none !important;
        font-weight: 700;
        box-shadow: none !important;
    `,
    workspaceCard: css`
        border-radius: 28px;
        border: 1px solid rgba(224, 123, 42, 0.14);
        box-shadow: ${shadows.soft};
        background: radial-gradient(circle at top right, rgba(224, 123, 42, 0.08), transparent 30%), ${colors.white};

        .ant-tabs-nav {
            margin: 0 0 22px !important;
        }

        .ant-tabs-tab {
            font-weight: 700;
            color: #8595ae;
            padding-top: 6px;
            padding-bottom: 16px;
        }

        .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: ${colors.navy} !important;
        }

        .ant-tabs-ink-bar {
            background: ${colors.amber} !important;
            height: 3px !important;
            border-radius: 999px;
        }
    `,
    editorPanel: css`
        display: grid;
        gap: 16px;
    `,
    editorHeader: css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    `,
    editorTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
    `,
    editorHint: css`
        color: #8797af;
        font-weight: 600;
    `,
    editorArea: css`
        min-height: 320px !important;
        border-radius: 22px !important;
        border-color: rgba(224, 123, 42, 0.24) !important;
        background: linear-gradient(180deg, #fffdfa 0%, #fdfbf8 100%) !important;
        padding: 16px 18px !important;
        font-size: 1rem !important;
        line-height: 1.7 !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
        resize: vertical !important;
    `,
    transcriptArea: css`
        min-height: 180px !important;
        border-radius: 20px !important;
        padding: 14px 16px !important;
    `,
    transcriptPreviewModal: css`
        max-height: 340px;
        overflow: auto;
        white-space: pre-line;
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        background: linear-gradient(180deg, #fffdfa 0%, #f8f4ee 100%);
        color: ${colors.navy};
        line-height: 1.7;
    `,
    transcriptPreviewArea: css`
        .ant-input {
            border-radius: 18px !important;
            border-color: rgba(13, 27, 46, 0.12) !important;
            padding: 14px 16px !important;
            line-height: 1.7 !important;
        }
    `,
    transcriptOverlay: css`
        position: fixed;
        inset: 0;
        background: rgba(13, 27, 46, 0.32);
        display: grid;
        place-items: center;
        padding: 20px;
        z-index: 1200;
    `,
    transcriptPreviewCard: css`
        width: min(680px, 100%);
        display: grid;
        gap: 14px;
        padding: 24px;
        border-radius: 28px;
        background: ${colors.white};
        border: 1px solid rgba(13, 27, 46, 0.08);
        box-shadow: ${shadows.panel};

        @media (max-width: 640px) {
            gap: 12px;
            padding: 18px;
            border-radius: 22px;
        }
    `,
    transcriptPreviewTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay};
    `,
    transcriptPreviewActions: css`
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        flex-wrap: wrap;

        @media (max-width: 640px) {
            > * {
                flex: 1 1 100%;
            }
        }
    `,
    objectiveGrid: css`
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;

        @media (max-width: 860px) {
            grid-template-columns: 1fr;
        }
    `,
    vitalCard: css`
        padding: 14px;
        border-radius: 22px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        background: linear-gradient(180deg, #fffdfa 0%, #f8f4ee 100%);
        display: grid;
        gap: 10px;
    `,
    vitalHeader: css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    `,
    vitalName: css`
        color: ${colors.navy};
        font-weight: 800;
    `,
    vitalUnit: css`
        color: #8c9ab0;
        font-size: 0.85rem;
        font-weight: 700;
    `,
    bpGrid: css`
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
    `,
    helperText: css`
        color: #8997aa;
        font-size: 0.88rem;
    `,
    inboxSection: css`
        display: grid;
        gap: 14px;
    `,
    pageSectionTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay};
    `,
    inboxGrid: css`
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;

        @media (max-width: 960px) {
            grid-template-columns: 1fr;
        }
    `,
    inboxCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid rgba(224, 123, 42, 0.16);
        box-shadow: ${shadows.soft};
    `,
    inboxCardHeader: css`
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 10px;
    `,
    inboxPatientName: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
    `,
    inboxSummary: css`
        color: #50617b;
        min-height: 54px;
        white-space: pre-line;
    `,
    inboxMeta: css`
        display: flex;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        color: #7d8ca4;
        font-size: 0.88rem;
        margin-bottom: 14px;
    `,
    draftPreview: css`
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px dashed rgba(224, 123, 42, 0.4);
        background: rgba(224, 123, 42, 0.06);
        color: #44566f;

        .ant-typography {
            white-space: pre-line;
        }
    `,
    timelineSummaryGrid: css`
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;

        @media (max-width: 900px) {
            grid-template-columns: 1fr;
        }
    `,
    timelineSummaryCard: css`
        display: grid;
        gap: 12px;
        padding: 18px;
        border-radius: 24px;
        border: 1px solid rgba(224, 123, 42, 0.16);
        background: linear-gradient(180deg, #fffdfa 0%, #f8f4ee 100%);
    `,
    timelineSummaryHeader: css`
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
    `,
    timelineSummaryTitle: css`
        margin: 0 0 4px !important;
        color: ${colors.navy} !important;
    `,
    timelineSummaryArea: css`
        min-height: 220px !important;
        border-radius: 20px !important;
        border-color: rgba(224, 123, 42, 0.24) !important;
        background: ${colors.white} !important;
        padding: 14px 16px !important;
        line-height: 1.65 !important;
        resize: vertical !important;
    `,
    summaryCounter: css`
        color: #7d8ca4;
        font-size: 0.85rem;
        font-weight: 700;
        white-space: nowrap;
    `,
    timelineReadyTag: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(35, 160, 112, 0.22) !important;
        background: rgba(35, 160, 112, 0.12) !important;
        color: #198a60 !important;
        font-weight: 700;
    `,
    timelinePendingTag: css`
        border-radius: ${radius.pill}px;
        border-color: rgba(224, 123, 42, 0.28) !important;
        background: rgba(224, 123, 42, 0.12) !important;
        color: ${colors.priority} !important;
        font-weight: 700;
    `,
    statusStrip: css`
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
        margin-bottom: 12px;
    `,
    successPill: css`
        border-radius: ${radius.pill}px;
        background: rgba(42, 123, 224, 0.1);
        color: ${colors.routine};
        padding: 6px 12px;
        font-weight: 700;
    `,
    emptyStateCard: css`
        border-radius: ${radius.md}px;
        border: 1px dashed rgba(13, 27, 46, 0.12);
        background: rgba(255, 255, 255, 0.72);
    `,
}));
