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
        // background: linear-gradient(180deg, ${colors.amberLight} 0%, ${colors.amber} 100%);
        // box-shadow: 0 8px 24px rgba(224, 123, 42, 0.28);
    `,

    brandText: css`
        font-family: ${typography.fontDisplay};
        color: ${colors.white};
        font-size: 2rem;
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
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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

        @media (max-width: 768px) {
            grid-template-columns: 1fr auto;
            gap: 10px;
            min-height: 68px;
        }
    `,

    topMenu: css`
        background: transparent !important;
        border-bottom: none !important;
        justify-self: center;
        min-width: 0;

        .ant-menu-item {
            color: rgba(255, 255, 255, 0.8);
            border-radius: ${radius.pill}px;
            font-weight: 700;
            margin-inline: 4px;
        }

        .ant-menu-item-selected {
            color: ${colors.white} !important;
            background: rgba(240, 144, 64, 0.22) !important;
        }

        .ant-menu-item::after {
            display: none !important;
        }

        @media (max-width: 768px) {
            display: none !important;
        }
    `,

    menuSpacer: css`
        min-height: 1px;
    `,

    actionArea: css`
        align-items: center;
        justify-self: end;
    `,

    profileAvatar: css`
        background: rgba(255, 255, 255, 0.1) !important;
        color: ${colors.white} !important;
        border: 1px solid rgba(255, 255, 255, 0.2);
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
