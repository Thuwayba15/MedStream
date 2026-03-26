import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, shadows, typography } = medstreamTheme;
const pageBackground = colors.offWhite;

export const useRoleShellStyles = createStyles(({ css }) => ({
    root: css`
        min-height: 100vh;
        background: ${pageBackground} !important;

        .ant-layout {
            background: ${pageBackground} !important;
        }
    `,

    sidebar: css`
        background: linear-gradient(180deg, ${colors.navy} 0%, ${colors.navyMid} 100%) !important;
        border-right: 1px solid ${colors.borderNavy};
        padding: 18px 12px 18px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-height: 100vh;
        height: 100%;
        overflow-y: auto;
    `,

    desktopSider: css`
        position: fixed !important;
        top: 0;
        left: 0;
        bottom: 0;
        height: 100vh !important;
        z-index: 100;

        .ant-layout-sider-children {
            height: 100%;
        }

        @media (max-width: 768px) {
            display: none !important;
        }
    `,

    mobileDrawer: css`
        .ant-drawer-mask {
            background: rgba(4, 12, 24, 0.56) !important;
        }
        .ant-drawer-content {
            background: linear-gradient(180deg, ${colors.navy} 0%, ${colors.navyMid} 100%) !important;
        }
        .ant-drawer-body {
            padding: 0 !important;
            background: linear-gradient(180deg, ${colors.navy} 0%, ${colors.navyMid} 100%) !important;
            height: 100%;
        }
    `,

    mobileDrawerContent: css`
        background: linear-gradient(180deg, ${colors.navy} 0%, ${colors.navyMid} 100%) !important;
        box-shadow: 10px 0 30px rgba(8, 16, 32, 0.35);
        height: 100vh;
        display: flex;
        flex-direction: column;
    `,

    mobileDrawerBody: css`
        padding: 0 !important;
        background: linear-gradient(180deg, ${colors.navy} 0%, ${colors.navyMid} 100%) !important;
        height: 100%;
        display: flex;
        flex-direction: column;

        > div {
            flex: 1;
            min-height: 0;
        }
    `,

    brandBlock: css`
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 12px 10px;
        border-radius: ${radius.md}px;
        background: rgba(255, 255, 255, 0.03);
    `,

    brandMark: css`
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
    `,

    brandText: css`
        font-family: ${typography.fontDisplay};
        color: ${colors.white};
        font-size: 1.5rem;
        line-height: 1;
    `,

    brandAccent: css`
        color: ${colors.amber};
        font-style: italic;
    `,

    roleChip: css`
        margin: 0 auto;
        width: fit-content;
        border-radius: ${radius.pill}px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.08);
        color: ${colors.white};
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    `,

    sidebarMenu: css`
        background: transparent !important;
        border-inline-end: none !important;
        flex: 1;

        .ant-menu-item {
            margin-inline: 8px !important;
            margin-block: 4px !important;
            border-radius: ${radius.sm}px;
            color: rgba(255, 255, 255, 0.86);
            font-weight: 600;
            height: 44px;
            line-height: 44px;
        }

        .ant-menu-item-active {
            background: rgba(255, 255, 255, 0.08) !important;
        }

        .ant-menu-item-selected {
            background: rgba(240, 144, 64, 0.2) !important;
            color: ${colors.white} !important;
        }
    `,

    logoutWrap: css`
        padding: 0 10px 16px;
        margin-top: auto;
        display: flex;
        justify-content: center;
        align-items: center;

        .ant-btn {
            width: 100%;
            max-width: 180px;
            justify-content: center;
            border-radius: ${radius.sm}px;
            border-color: rgba(255, 255, 255, 0.24);
            color: ${colors.white};
            background: rgba(255, 255, 255, 0.04);

            &:hover,
            &:focus {
                border-color: rgba(255, 255, 255, 0.34) !important;
                color: ${colors.white} !important;
                background: rgba(255, 255, 255, 0.1) !important;
            }
        }
    `,
    facilityFormSection: css`
        background: ${colors.amberPale};
        border-radius: ${radius.md}px;
        padding: 18px 16px 12px 16px;
        margin-bottom: 18px;
    `,

    contentLayout: css`
        min-height: 100vh;
        background: ${pageBackground} !important;
        margin-left: 286px;

        @media (max-width: 768px) {
            margin-left: 0;
        }
    `,

    mobileHeader: css`
        display: none;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        border-bottom: 1px solid ${colors.borderLight};
        background: ${colors.white};

        @media (max-width: 768px) {
            display: flex;
        }
    `,

    mobileBrand: css`
        font-family: ${typography.fontDisplay};
        color: ${colors.navy};
        font-size: 1.25rem;
        line-height: 1;
    `,

    mobileBrandAccent: css`
        color: ${colors.amber};
        font-style: italic;
    `,

    content: css`
        padding: 24px 16px;
        background: ${pageBackground} !important;

        @media (max-width: 768px) {
            padding: 16px 12px;
        }
    `,

    contentInner: css`
        width: 100%;
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        gap: 18px;
        background: transparent;
    `,

    panelCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid ${colors.borderLight};
        box-shadow: ${shadows.soft};
        background: ${colors.white};
    `,
}));
