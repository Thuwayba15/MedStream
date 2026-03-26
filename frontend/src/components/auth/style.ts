import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, layout, radius, typography } = medstreamTheme;

export const useAuthStyles = createStyles(({ css }) => ({
    page: css`
        min-height: 100vh;
        background: linear-gradient(135deg, ${colors.navy} 0%, #101f34 55%, #142845 100%);
        padding: 18px;
        position: relative;
        overflow: hidden;
    `,

    layout: css`
        width: 100%;
        min-height: calc(100vh - 36px);
        border-radius: ${radius.lg}px;
        overflow: hidden;
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 24px 70px rgba(3, 10, 22, 0.45);
        background: radial-gradient(circle at 16% 18%, rgba(240, 144, 64, 0.18) 0%, rgba(240, 144, 64, 0) 30%), linear-gradient(165deg, #0e1e34 0%, #0a1729 100%);

        @media (max-width: 980px) {
            grid-template-columns: 1fr;
            min-height: auto;
        }
    `,

    panelLeft: css`
        padding: 46px 56px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 42px;

        @media (max-width: 980px) {
            display: none;
        }
    `,

    brand: css`
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
    `,

    brandLink: css`
        text-decoration: none;
        width: fit-content;
        margin: 0 auto;
        transition: transform 200ms ease;

        &:hover {
            transform: translateY(-1px);
        }
    `,

    brandMark: css`
        width: 56px;
        height: 56px;
        display: grid;
        place-items: center;
    `,

    brandText: css`
        font-family: ${typography.fontDisplay};
        font-size: 2.2rem;
        line-height: 1;
        color: ${colors.white};
    `,

    brandTextAccent: css`
        color: ${colors.amber};
        font-style: italic;
    `,

    eyebrow: css`
        color: ${colors.amber};
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        margin-bottom: 18px;
        text-align: center;
    `,

    leftTitle: css`
        margin: 0;
        text-align: center;
        color: ${colors.white};
        font-family: ${typography.fontDisplay};
        font-size: clamp(2.2rem, 3.8vw, 3.3rem);
        line-height: 1.08;
    `,

    leftTitleAccent: css`
        color: ${colors.amber};
        font-style: italic;
    `,

    leftText: css`
        margin: 18px auto 0;
        max-width: 460px;
        text-align: center;
        color: #9fb0c8;
        font-size: 0.98rem;
        line-height: 1.78;
    `,

    panelRight: css`
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 46px 42px;
        background: radial-gradient(circle at top right, rgba(240, 144, 64, 0.12) 0%, rgba(240, 144, 64, 0) 38%), ${colors.offWhite};

        @media (max-width: 980px) {
            padding: 22px;
        }
    `,

    card: css`
        width: 100%;
        max-width: 460px;
        border-radius: ${radius.lg}px;
        border: 1px solid ${colors.borderLight};
        box-shadow: 0 22px 44px rgba(10, 24, 42, 0.2);
        background: ${colors.white};
        padding: 28px 24px 24px;
    `,

    title: css`
        margin: 0;
        text-align: center;
        color: ${colors.navy};
        font-family: ${typography.fontDisplay};
        font-size: clamp(1.8rem, 4vw, 2.2rem);
    `,

    subtitle: css`
        margin: 8px 0 22px;
        text-align: center;
        color: ${colors.slate};
        font-size: 0.92rem;
        line-height: 1.6;
    `,

    alertBlock: css`
        margin-bottom: 14px;
    `,

    form: css`
        .ant-form-item {
            margin-bottom: 14px;
        }

        .ant-form-item-label > label {
            font-size: 0.76rem;
            font-weight: 700;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            color: ${colors.navy};
        }

        .ant-input,
        .ant-input-password {
            min-height: 46px;
            border-radius: 12px !important;
            background: #f0ece6;
            border: 1px solid transparent !important;
        }

        .ant-input:focus,
        .ant-input-focused,
        .ant-input-password-focused {
            border-color: ${colors.amber} !important;
            box-shadow: 0 0 0 3px rgba(224, 123, 42, 0.12) !important;
            background: ${colors.white};
        }

        .ant-btn {
            min-height: 48px;
            border-radius: 12px;
            font-weight: 700;
        }

        .ant-radio-group {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .ant-radio-wrapper {
            margin-inline-end: 0;
        }
    `,

    submitButton: css`
        position: relative;
        overflow: visible;
        isolation: isolate;
        background: linear-gradient(180deg, ${colors.amberLight} 0%, ${colors.amber} 100%) !important;
        border-color: transparent !important;
        color: ${colors.white} !important;
        box-shadow:
            0 16px 30px rgba(224, 123, 42, 0.28),
            0 0 0 1px rgba(240, 144, 64, 0.14);

        &::after {
            content: "";
            position: absolute;
            inset: auto 14px -12px;
            height: 22px;
            border-radius: 999px;
            background: rgba(224, 123, 42, 0.34);
            filter: blur(14px);
            z-index: -1;
            pointer-events: none;
        }

        &:hover,
        &:focus {
            background: linear-gradient(180deg, ${colors.amberLight} 0%, ${colors.amber} 100%) !important;
            color: ${colors.white} !important;
            border-color: transparent !important;
            transform: translateY(-2px);
            box-shadow:
                0 20px 34px rgba(224, 123, 42, 0.3),
                0 0 0 1px rgba(240, 144, 64, 0.18),
                0 0 24px rgba(224, 123, 42, 0.2);
        }
    `,

    footerText: css`
        margin-top: 16px;
        text-align: center;
        color: ${colors.slate};
        font-size: 0.88rem;
    `,

    dashboardPage: css`
        min-height: 100vh;
        background: radial-gradient(circle at 84% 10%, rgba(30, 49, 80, 0.11) 0%, rgba(30, 49, 80, 0) 30%), linear-gradient(180deg, #ffffff 0%, ${colors.offWhite} 100%);
        padding: 28px 16px;
    `,

    dashboardShell: css`
        width: 100%;
        max-width: ${layout.pageMaxWidth}px;
        margin: 0 auto;
        display: grid;
        gap: 20px;
    `,

    dashboardCard: css`
        border-radius: ${radius.md}px;
        border: 1px solid ${colors.borderLight};
        background: ${colors.white};
        box-shadow: ${medstreamTheme.shadows.soft};
        padding: 22px;
    `,

    dashboardHeading: css`
        margin: 0 0 12px;
        color: ${colors.navy};
        font-family: ${typography.fontDisplay};
        font-size: clamp(1.8rem, 4vw, 2.2rem);
    `,

    dashboardText: css`
        margin: 0;
        color: ${colors.slate};
        line-height: 1.7;
    `,
}));
