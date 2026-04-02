import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, typography } = medstreamTheme;

export const useAdminStyles = createStyles(({ css }) => ({
    pageHeader: css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        padding: 4px 2px;
    `,

    pageEyebrow: css`
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: ${colors.amber};
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        margin-bottom: 8px;

        &::before {
            content: "";
            width: 20px;
            height: 1.5px;
            background: ${colors.amber};
        }
    `,

    pageTitle: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay} !important;
        font-size: clamp(1.9rem, 4vw, 2.45rem) !important;
        line-height: 1.08 !important;
    `,

    pageIntro: css`
        margin: 10px 0 0 !important;
        max-width: 720px;
        color: ${colors.slate} !important;
        font-size: 0.96rem;
        line-height: 1.75 !important;
    `,

    statStrip: css`
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;

        @media (max-width: 1100px) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @media (max-width: 640px) {
            grid-template-columns: 1fr;
        }
    `,

    statCard: css`
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px 20px;
        border-radius: 14px;
        border: 1px solid rgba(13, 27, 46, 0.08);
        background: ${colors.white};
        box-shadow: 0 8px 24px rgba(13, 27, 46, 0.04);
        transition:
            transform ${medstreamTheme.motion.quick} ease,
            box-shadow ${medstreamTheme.motion.quick} ease;

        &::before {
            content: "";
            position: absolute;
            inset: 0 auto auto 0;
            width: 100%;
            height: 3px;
            opacity: 0;
            transition: opacity ${medstreamTheme.motion.quick} ease;
        }

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 30px rgba(13, 27, 46, 0.08);
        }

        &:hover::before {
            opacity: 1;
        }
    `,

    statCardPending: css`
        &::before {
            background: ${colors.amber};
        }
    `,

    statCardApproved: css`
        &::before {
            background: #1a9e6e;
        }
    `,

    statCardDeclined: css`
        &::before {
            background: ${colors.urgent};
        }
    `,

    statCardDefault: css`
        &::before {
            background: ${colors.navy};
        }
    `,

    statIcon: css`
        width: 42px;
        height: 42px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
    `,

    statIconPending: css`
        background: ${colors.amberPale};
        color: ${colors.amber};
    `,

    statIconApproved: css`
        background: rgba(26, 158, 110, 0.1);
        color: #1a9e6e;
    `,

    statIconDeclined: css`
        background: rgba(201, 64, 64, 0.08);
        color: ${colors.urgent};
    `,

    statIconDefault: css`
        background: rgba(13, 27, 46, 0.08);
        color: ${colors.navy};
    `,

    statLabel: css`
        display: block;
        margin-bottom: 4px;
        color: ${colors.slate};
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    `,

    statValue: css`
        margin: 0 !important;
        color: ${colors.navy} !important;
        font-family: ${typography.fontDisplay};
        font-size: 1.7rem !important;
        line-height: 1 !important;
    `,

    statValuePending: css`
        color: ${colors.amber} !important;
    `,

    statValueApproved: css`
        color: #1a9e6e !important;
    `,

    statValueDeclined: css`
        color: ${colors.urgent} !important;
    `,

    statValueDefault: css``,

    alertStack: css`
        display: grid;
        gap: 10px;
    `,

    panelCard: css`
        padding: 22px;
        border-radius: ${radius.lg}px;
    `,

    heroCard: css`
        padding: 26px;
        border-radius: ${radius.lg}px;
        border: 1px solid rgba(13, 27, 46, 0.1);
        background: linear-gradient(120deg, ${colors.navy} 0%, ${colors.navyMid} 75%);
        box-shadow: 0 18px 44px rgba(13, 27, 46, 0.22);
    `,

    heroHeading: css`
        margin: 0 0 10px !important;
        color: ${colors.white} !important;
        font-family: ${typography.fontDisplay};
    `,

    heroText: css`
        margin: 0 !important;
        color: #d2d9e5 !important;
    `,

    headerRow: css`
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    `,

    headerActions: css`
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-left: auto;
    `,

    pendingBadge: css`
        font-weight: 700;
        border-radius: ${radius.pill}px;
        border-color: rgba(13, 27, 46, 0.18) !important;
        margin-right: 4px;
    `,

    pendingLivePill: css`
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        border-radius: ${radius.pill}px;
        background: rgba(26, 158, 110, 0.1);
        border: 1px solid rgba(26, 158, 110, 0.22);
        color: #1a9e6e;
        font-size: 0.78rem;
        font-weight: 700;

        @media (max-width: 768px) {
            width: 100%;
            justify-content: center;
        }
    `,

    pendingLiveDot: css`
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: #1a9e6e;
    `,

    tableCard: css`
        overflow: hidden;
        border-color: rgba(13, 27, 46, 0.08);
        box-shadow: 0 10px 30px rgba(13, 27, 46, 0.08);
        background: #fcfaf6;

        .ant-tabs-nav::before {
            border-color: rgba(13, 27, 46, 0.12);
        }

        .ant-tabs-tab {
            color: ${colors.slate};
            font-weight: 600;
        }

        .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
            color: ${colors.amber};
        }

        .ant-tabs-ink-bar {
            background: ${colors.amber};
        }

        .ant-tabs-extra-content {
            margin-left: auto;
            padding-left: 8px;
        }

        .ant-tabs-nav {
            margin-bottom: 0 !important;
            padding: 0 18px;

            @media (max-width: 768px) {
                padding: 0 14px;
            }
        }

        .ant-tabs-content-holder {
            padding: 18px;

            @media (max-width: 768px) {
                padding: 14px;
            }
        }

        .ant-table {
            background: transparent;
        }

        .ant-table-thead > tr > th {
            background: #f6f2eb !important;
            color: ${colors.slate} !important;
            font-size: 0.68rem !important;
            font-weight: 700 !important;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            border-bottom-color: rgba(13, 27, 46, 0.08) !important;
        }

        .ant-table-tbody > tr > td {
            background: ${colors.white};
            border-bottom-color: rgba(13, 27, 46, 0.08) !important;
            vertical-align: top;
        }

        .ant-table-tbody > tr:hover > td {
            background: #fffcf8 !important;
        }

        .ant-table-tbody > tr > td:first-child {
            border-inline-start: 4px solid transparent;
        }

        .admin-approval-row-pending > td:first-child {
            border-inline-start-color: ${colors.amber};
        }

        .admin-approval-row-approved > td:first-child {
            border-inline-start-color: #1a9e6e;
        }

        .admin-approval-row-declined > td:first-child {
            border-inline-start-color: ${colors.urgent};
        }
    `,

    tabLabel: css`
        display: inline-flex;
        align-items: center;
        gap: 8px;
    `,

    tabCountBadge: css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 20px;
        padding: 0 8px;
        border-radius: 999px;
        background: ${colors.amberPale};
        color: ${colors.amber};
        font-size: 0.7rem;
        font-weight: 700;
    `,

    mobileTabList: css`
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 2px 10px;
        border-bottom: 1px solid rgba(13, 27, 46, 0.12);
        overflow-x: auto;
        scrollbar-width: none;

        &::-webkit-scrollbar {
            display: none;
        }
    `,

    mobileTabButton: css`
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 12px;
        border: none;
        border-bottom: 2.5px solid transparent;
        background: transparent;
        color: ${colors.slate};
        font-weight: 600;
        white-space: nowrap;
        cursor: pointer;

        &:hover {
            color: ${colors.navy};
        }
    `,

    mobileTabButtonActive: css`
        color: ${colors.amber};
        border-bottom-color: ${colors.amber};
        font-weight: 700;
    `,

    mobileTabMeta: css`
        display: grid;
        gap: 10px;
        padding: 10px 2px 0;
    `,

    toolbar: css`
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        padding: 2px 2px 10px;
    `,

    tableWrap: css`
        width: 100%;
        overflow-x: auto;
    `,

    fullWidth: css`
        width: 100%;
    `,

    searchInput: css`
        min-width: 320px;
        max-width: 360px;

        .ant-input,
        .ant-input-group-addon {
            background: ${colors.white};
            border-color: rgba(13, 27, 46, 0.2) !important;
        }

        .ant-input-search-button {
            border-color: rgba(13, 27, 46, 0.2) !important;
        }

        @media (max-width: 768px) {
            min-width: 100%;
            max-width: 100%;
        }
    `,

    filterSelect: css`
        min-width: 180px;

        @media (max-width: 768px) {
            width: 100%;
        }
    `,

    assignSelect: css`
        min-width: 180px;
    `,

    assignControlStack: css`
        width: 100%;
        align-items: stretch;
    `,

    primaryActionButton: css`
        min-width: 110px;
        border-radius: ${radius.pill}px !important;
        background: linear-gradient(180deg, ${colors.amberLight} 0%, ${colors.amber} 100%) !important;
        border-color: ${colors.amber} !important;
        color: ${colors.white} !important;
        font-weight: 700;
        box-shadow: 0 10px 24px rgba(224, 123, 42, 0.24);
    `,

    secondaryActionButton: css`
        min-width: 110px;
        border-radius: ${radius.pill}px !important;
        border-color: rgba(13, 27, 46, 0.2) !important;
        color: ${colors.navy} !important;
        font-weight: 700;
        background: ${colors.white} !important;
    `,

    actionStack: css`
        justify-content: flex-end;

        @media (max-width: 1280px) {
            flex-direction: column;
            align-items: stretch;
        }
    `,

    facilityFormGrid: css`
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px 16px;
        width: 100%;

        @media (max-width: 1200px) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
        }
    `,

    facilityFormSection: css`
        background: ${colors.white};
        border: 1px solid rgba(224, 123, 42, 0.18);
        border-radius: ${radius.md}px;
        padding: 18px 16px 12px 16px;
        margin-bottom: 18px;
    `,

    secondaryTextStack: css`
        display: grid;
        gap: 3px;

        .ant-typography {
            line-height: 1.4;
        }
    `,

    headingHint: css`
        color: ${colors.slate};
        font-family: ${typography.fontBody};
    `,

    stateTag: css`
        text-transform: capitalize;
    `,

    statusTag: css`
        text-transform: capitalize;
    `,

    applicantCell: css`
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 220px;
    `,

    applicantAvatar: css`
        width: 40px;
        height: 40px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-family: ${typography.fontDisplay};
        font-size: 0.9rem;
        font-weight: 700;
        color: ${colors.white};
        background: ${colors.navy};
    `,

    applicantAvatarPending: css`
        background: ${colors.amberPale};
        color: ${colors.amber};
    `,

    applicantAvatarApproved: css`
        background: rgba(26, 158, 110, 0.12);
        color: #1a9e6e;
    `,

    applicantAvatarDeclined: css`
        background: rgba(201, 64, 64, 0.1);
        color: ${colors.urgent};
    `,

    applicantMeta: css`
        display: grid;
        gap: 2px;
    `,

    applicantName: css`
        color: ${colors.navy} !important;
        font-size: 0.92rem;
        font-weight: 700;
        line-height: 1.3;
    `,

    applicantSubtext: css`
        color: ${colors.slate} !important;
        font-size: 0.76rem;
        line-height: 1.45;
    `,

    registrationCell: css`
        display: grid;
        gap: 3px;
        min-width: 150px;
    `,

    registrationRole: css`
        color: ${colors.navy} !important;
        font-size: 0.86rem;
        font-weight: 700;
    `,

    registrationBody: css`
        color: ${colors.slate} !important;
        font-size: 0.75rem;
        font-weight: 600;
    `,

    registrationNumber: css`
        color: ${colors.slate} !important;
        font-size: 0.75rem;
    `,

    registrationMeta: css`
        color: ${colors.slate} !important;
        font-size: 0.72rem;
    `,

    facilityName: css`
        color: ${colors.navy} !important;
        font-size: 0.88rem;
        font-weight: 700;
    `,

    auditTrail: css`
        display: grid;
        gap: 3px;
        min-width: 210px;
    `,

    auditItem: css`
        color: ${colors.slate} !important;
        font-size: 0.75rem;
        line-height: 1.55;
    `,

    auditLabel: css`
        color: ${colors.navy};
        font-weight: 700;
    `,

    statusPill: css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-width: 96px;
        padding: 5px 10px;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;

        &::before {
            content: "";
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: currentColor;
        }
    `,

    statusPillPending: css`
        background: ${colors.amberPale};
        color: ${colors.amber};
        border: 1px solid rgba(224, 123, 42, 0.22);
    `,

    statusPillApproved: css`
        background: rgba(26, 158, 110, 0.1);
        color: #1a9e6e;
        border: 1px solid rgba(26, 158, 110, 0.2);
    `,

    statusPillDeclined: css`
        background: rgba(201, 64, 64, 0.08);
        color: ${colors.urgent};
        border: 1px solid rgba(201, 64, 64, 0.18);
    `,

    mobileFacilityList: css`
        display: grid;
        gap: 14px;
    `,

    mobileFacilityCard: css`
        border-radius: ${radius.md}px !important;
        border-color: rgba(13, 27, 46, 0.08) !important;
        background: ${colors.white};
        box-shadow: 0 8px 20px rgba(13, 27, 46, 0.05);

        .ant-card-body {
            padding: 16px;
        }
    `,

    mobileCardHeader: css`
        width: 100%;
        justify-content: space-between;
    `,

    mobileCardTitle: css`
        margin: 0 0 2px !important;
        color: ${colors.navy} !important;
        font-size: 1rem !important;
    `,

    mobileFacilityMeta: css`
        display: grid;
        gap: 4px;

        .ant-typography {
            line-height: 1.5;
        }
    `,
}));
