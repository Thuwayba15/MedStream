import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius } = medstreamTheme;

export const usePatientBottomNavStyles = createStyles(({ css }) => ({
    bottomNavWrap: css`
        padding: 0 0 8px;
        border-bottom: 1px solid rgba(13, 27, 46, 0.12);
        margin-bottom: 0;
        width: 100%;
    `,

    navRow: css`
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 2px;
        overflow-x: auto;
        scrollbar-width: none;

        &::-webkit-scrollbar {
            display: none;
        }

        @media (max-width: 768px) {
            justify-content: flex-start;
            gap: 0;
        }
    `,

    navButton: css`
        min-height: 44px;
        padding-inline: 14px !important;
        font-weight: 600;
        color: ${colors.slate} !important;
        border: none !important;
        border-bottom: 2.5px solid transparent !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        flex: 0 0 auto;

        &:hover,
        &:focus {
            color: ${colors.navy} !important;
            background: transparent !important;
        }

        &.ant-btn[disabled] {
            color: rgba(138, 154, 181, 0.55) !important;
            background: transparent !important;
            border-color: transparent !important;
        }
    `,

    navButtonActive: css`
        color: ${colors.navy} !important;
        border-bottom-color: ${colors.amber} !important;
        font-weight: 700;
    `,
}));
