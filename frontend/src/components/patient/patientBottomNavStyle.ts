import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, radius } = medstreamTheme;

export const usePatientBottomNavStyles = createStyles(({ css }) => ({
    bottomNavWrap: css`
        padding: 10px 8px 12px;
        border-top: 1px solid rgba(138, 154, 181, 0.2);
        border-bottom: 1px solid rgba(138, 154, 181, 0.2);
        margin-bottom: 14px;
        width: 100%;
    `,

    navRow: css`
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
    `,

    navButton: css`
        min-height: 42px;
        font-weight: 700;
        color: #8091af;
        border-color: rgba(138, 154, 181, 0.25);
        border-radius: ${radius.sm}px;
    `,

    navButtonActive: css`
        background: rgba(240, 144, 64, 0.16) !important;
        color: ${colors.amber} !important;
        border-color: rgba(240, 144, 64, 0.3) !important;
    `,
}));
