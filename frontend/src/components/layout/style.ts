import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius, typography } = medstreamTheme;
const pageBackground = colors.offWhite;

export const useRoleShellStyles = createStyles(({ css }) => ({
    root: css`
        min-height: 100vh;
        background: ${pageBackground} !important;

        .ant-layout {
            background: ${pageBackground};
        }
    `,

    brandBlock: css`
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 170px;
    `,

    brandMark: css`
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        border-radius: 10px;
    `,

    brandText: css`
        font-family: ${typography.fontDisplay};
        color: ${colors.white};
        font-size: clamp(1.5rem, 2.8vw, 2rem);
        line-height: 1;
    `,

    brandAccent: css`
        color: ${colors.amber};
        font-style: italic;
    `,

    topHeader: css`
        position: sticky;
        top: 0;
        z-index: 40;
        height: auto;
        line-height: 1;
        padding: 0;
        background: linear-gradient(90deg, ${colors.navy} 0%, ${colors.navyMid} 100%) !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    `,

    headerInner: css`
        max-width: ${medstreamTheme.layout.pageMaxWidth}px;
        margin: 0 auto;
        min-height: 74px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 16px;
        padding: 12px 16px;

        @media (max-width: 960px) {
            grid-template-columns: 1fr auto;
            min-height: 68px;
            gap: 8px;
        }
    `,

    topMenu: css`
        background: transparent !important;
        border-bottom: none !important;
        justify-self: center;
        min-width: 0;

        .ant-menu-item {
            color: rgba(255, 255, 255, 0.82);
            border-radius: ${radius.pill}px;
            font-weight: 700;
            margin-inline: 4px;
        }

        .ant-menu-item-selected {
            color: ${colors.white} !important;
            background: rgba(255, 255, 255, 0.12) !important;
        }

        .ant-menu-item::after {
            display: none !important;
        }

        @media (max-width: 960px) {
            display: none !important;
        }
    `,

    menuSpacer: css`
        min-height: 1px;

        @media (max-width: 960px) {
            display: none;
        }
    `,

    actionArea: css`
        align-items: center;
        justify-self: end;

        @media (max-width: 960px) {
            display: none !important;
        }
    `,

    clockPill: css`
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 36px;
        padding: 0 12px;
        border-radius: ${radius.pill}px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.18);
        color: ${colors.slateLight};
        font-weight: 700;
        font-size: 0.9rem;
    `,

    profileAvatar: css`
        background: rgba(255, 255, 255, 0.1) !important;
        color: ${colors.white} !important;
        border: 1px solid rgba(255, 255, 255, 0.2);
    `,

    roleLabel: css`
        color: ${colors.slateLight} !important;
        font-weight: 700;
        text-transform: capitalize;
    `,

    logoutButton: css`
        border-radius: ${radius.sm}px !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        color: ${colors.slateLight} !important;
        background: rgba(255, 255, 255, 0.02) !important;
        min-width: 124px;
        height: 40px;
        font-weight: 700;

        &:hover,
        &:focus {
            color: ${colors.white} !important;
            border-color: rgba(255, 255, 255, 0.35) !important;
            background: rgba(255, 255, 255, 0.09) !important;
        }
    `,

    mobileMenuButton: css`
        display: none !important;

        @media (max-width: 960px) {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            color: ${colors.white} !important;
            border-radius: ${radius.sm}px;
            border: 1px solid rgba(255, 255, 255, 0.22) !important;
            background: rgba(255, 255, 255, 0.05) !important;
        }
    `,

    mobileDrawer: css`
        .ant-drawer-header-title {
            color: ${colors.navy};
            font-family: ${typography.fontDisplay};
        }
    `,

    mobileDrawerFooter: css`
        margin-top: 16px;
        padding-top: 14px;
        border-top: 1px solid rgba(13, 27, 46, 0.08);
        display: grid;
        gap: 10px;
    `,

    mobileLogoutButton: css`
        width: 100%;
        border-radius: ${radius.sm}px !important;
        height: 42px;
        font-weight: 700;
    `,

    content: css`
        padding: 22px 16px 26px;
        background: ${pageBackground} !important;

        @media (max-width: 768px) {
            padding: 14px 12px 20px;
        }
    `,

    contentInner: css`
        width: 100%;
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        gap: 16px;
        background: transparent;
    `,
}));
