import { createStyles, medstreamTheme } from "@/theme/theme";

const { colors, layout, radius, typography } = medstreamTheme;

export const useLandingStyles = createStyles(({ css }) => ({
    page: css`
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        background:
            radial-gradient(circle at 14% 16%, rgba(240, 144, 64, 0.16) 0%, rgba(240, 144, 64, 0) 26%),
            radial-gradient(circle at 82% 22%, rgba(13, 27, 46, 0.08) 0%, rgba(13, 27, 46, 0) 18%),
            radial-gradient(circle at 70% 78%, rgba(30, 49, 80, 0.08) 0%, rgba(30, 49, 80, 0) 24%),
            linear-gradient(135deg, #fffdfa 0%, ${colors.offWhite} 44%, #f3eee7 100%);

        &::before,
        &::after {
            content: "";
            position: absolute;
            border-radius: 999px;
            filter: blur(16px);
            pointer-events: none;
        }

        &::before {
            top: 88px;
            left: -80px;
            width: 240px;
            height: 240px;
            background: radial-gradient(circle, rgba(240, 144, 64, 0.18) 0%, rgba(240, 144, 64, 0) 72%);
        }

        &::after {
            right: -70px;
            bottom: 56px;
            width: 260px;
            height: 260px;
            background: radial-gradient(circle, rgba(22, 37, 64, 0.13) 0%, rgba(22, 37, 64, 0) 72%);
        }
    `,

    shell: css`
        width: 100%;
        max-width: ${layout.pageMaxWidth}px;
        min-height: 100vh;
        margin: 0 auto;
        padding: 44px 28px 56px;
        display: grid;
        grid-template-columns: minmax(0, ${layout.heroColumnMaxWidth}px) minmax(320px, ${layout.panelMaxWidth}px);
        align-items: center;
        justify-content: space-between;
        gap: 48px;

        @media (max-width: 1080px) {
            grid-template-columns: 1fr;
            gap: 34px;
            padding-top: 32px;
            padding-bottom: 40px;
        }

        @media (max-width: 768px) {
            padding: 24px 18px 34px;
            gap: 24px;
        }
    `,

    hero: css`
        display: flex;
        flex-direction: column;
        gap: 30px;
    `,

    brandRow: css`
        display: inline-flex;
        align-items: center;
        gap: 14px;
        width: fit-content;
    `,

    brandImageWrap: css`
        width: 44px;
        height: 58px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    `,

    brandImage: css`
        width: 44px;
        height: 58px;
        object-fit: contain;
    `,

    logoText: css`
        font-family: ${typography.fontDisplay};
        font-size: 2.55rem;
        font-weight: 600;
        letter-spacing: -0.01em;
        display: flex;
        align-items: baseline;
        gap: 0;
        text-decoration: none;
    `,

    logoMed: css`
        color: ${colors.navy};
    `,

    logoStream: css`
        color: ${colors.amber};
        font-style: italic;
    `,

    copyBlock: css`
        display: flex;
        flex-direction: column;
        gap: 24px;
    `,

    title: css`
        margin: 0;
        max-width: 11ch;
        color: ${colors.navy};
        font-family: ${typography.fontDisplay};
        font-size: clamp(3.55rem, 7vw, 5.45rem);
        font-weight: 650;
        line-height: 0.98;
        letter-spacing: -0.05em;

        @media (max-width: 768px) {
            max-width: 100%;
            font-size: clamp(3rem, 13vw, 4.35rem);
        }
    `,

    titleAccent: css`
        color: ${colors.amber};
        font-style: italic;
    `,

    description: css`
        margin: 0;
        max-width: 34rem;
        color: ${colors.slate};
        font-size: 1.22rem;
        line-height: 1.85;

        @media (max-width: 768px) {
            font-size: 1.04rem;
            line-height: 1.75;
        }
    `,

    actions: css`
        display: flex;
        flex-wrap: nowrap;
        gap: 20px;
        width: fit-content;
        max-width: 430px;

        .ant-btn {
            flex: 1 1 0;
            min-width: 0;
            width: 100%;
            height: 78px;
            padding-inline: 28px;
            font-size: 1.18rem;
            font-weight: 700;
            border-radius: 24px;
            transition:
                transform 220ms ease,
                box-shadow 220ms ease,
                border-color 220ms ease,
                background 220ms ease;
        }

        @media (max-width: 768px) {
            gap: 12px;
            max-width: 100%;

            .ant-btn {
                height: 74px;
                padding-inline: 18px;
                font-size: 1.05rem;
            }
        }

        @media (max-width: 420px) {
            .ant-btn {
                height: 70px;
                font-size: 1rem;
            }
        }
    `,

     primaryButton: css`
        position: relative;
        background: linear-gradient(180deg, ${colors.amberLight} 0%, ${colors.amber} 100%);
        color: ${colors.white};
        border-color: transparent;
        box-shadow:
            0 20px 34px rgba(224, 123, 42, 0.26),
            0 0 0 1px rgba(240, 144, 64, 0.14);
        overflow: visible;
        isolation: isolate;

        &::after {
            content: "";
            position: absolute;
            inset: auto 14px -14px;
            height: 26px;
            border-radius: 999px;
            background: rgba(224, 123, 42, 0.42);
            filter: blur(18px);
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
                0 24px 38px rgba(224, 123, 42, 0.3),
                0 0 0 1px rgba(240, 144, 64, 0.18),
                0 0 26px rgba(224, 123, 42, 0.22);
        }
    `,
    secondaryButton: css`
        position: relative;
        background: ${colors.white};
        color: ${colors.navy};
        border: 1.5px solid rgba(13, 27, 46, 0.5);
        box-shadow:
            0 12px 24px rgba(13, 27, 46, 0.08),
            0 0 0 1px rgba(224, 123, 42, 0.08);
        overflow: visible;
        isolation: isolate;

        /* amber glow for login button */
        &::after {
            content: "";
            position: absolute;
            inset: auto 16px -12px;
            height: 22px;
            border-radius: 999px;
            background: rgba(224, 123, 42, 0.28);
            filter: blur(16px);
            z-index: -1;
            pointer-events: none;
        }

        &:hover,
        &:focus {
            color: ${colors.navy} !important;
            border-color: ${colors.amber} !important;
            background: ${colors.white} !important;
            transform: translateY(-2px);
            box-shadow:
                0 18px 30px rgba(13, 27, 46, 0.1),
                0 0 0 1px rgba(224, 123, 42, 0.16),
                0 0 24px rgba(224, 123, 42, 0.18);
        }
    `,

    panelWrap: css`
        display: flex;
        justify-content: flex-end;
        align-self: stretch;

        @media (max-width: 1080px) {
            justify-content: flex-start;
        }
    `,

     panel: css`
        position: relative;
        width: 100%;
        max-width: ${layout.panelMaxWidth}px;
        min-height: 220px;
        overflow: hidden;
        border-radius: ${radius.lg}px;
        background:
            radial-gradient(circle at top right, rgba(224, 123, 42, 0.16), rgba(224, 123, 42, 0) 30%),
            linear-gradient(180deg, ${colors.navyMid} 0%, ${colors.navy} 100%);
        color: ${colors.white};
        border: 1px solid ${colors.borderNavy};
        padding: 30px 28px 26px;
        transform: translateZ(0);
        display: grid;
        grid-template-rows: auto auto 1fr;
        box-shadow:
            0 28px 60px rgba(8, 17, 31, 0.28),
            0 12px 28px rgba(8, 17, 31, 0.18),
            0 0 0 1px rgba(255, 255, 255, 0.03);

        @media (max-width: 768px) {
            min-height: 640px;
            padding: 24px 20px 22px;
        }
    `,


    panelGlow: css`
        position: absolute;
        inset: auto -70px -100px auto;
        width: 220px;
        height: 220px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(224, 123, 42, 0.18) 0%, rgba(224, 123, 42, 0) 70%);
        pointer-events: none;
        animation: medstreamGlowFloat 7.2s ease-in-out infinite;
    `,

    panelHeaderStack: css`
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 26px;
    `,

    panelBrand: css`
        display: flex;
        align-items: center;
        gap: 16px;
    `,

    panelBrandImage: css`
        width: 34px;
        height: 44px;
        object-fit: contain;
        flex-shrink: 0;
    `,

    timeline: css`
        position: relative;
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 12px;
        align-items: start;
        margin-bottom: 30px;
        padding-top: 10px;

        @media (max-width: 768px) {
            gap: 8px;
        }
    `,

    timelineRail: css`
    position: absolute;
    top: 31px;
    left: 32px;
    right: 32px;
    height: 3px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    pointer-events: none;
    overflow: hidden;
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.04);

    @media (max-width: 768px) {
        left: 24px;
        right: 24px;
    }
`,

timelineRailProgress: css`
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
        90deg,
        rgba(224, 123, 42, 0.95) 0%,
        rgba(240, 144, 64, 0.92) 55%,
        rgba(255, 196, 120, 0.88) 100%
    );
    transform: scaleX(0);
    transform-origin: left center;
    transition:
        transform 700ms cubic-bezier(0.22, 1, 0.36, 1),
        opacity 320ms ease;
    box-shadow:
        0 0 18px rgba(224, 123, 42, 0.28),
        0 0 6px rgba(240, 144, 64, 0.2);

    &::after {
        content: "";
        position: absolute;
        top: 50%;
        right: -10px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 214, 163, 0.9) 0%, rgba(224, 123, 42, 0.55) 45%, rgba(224, 123, 42, 0) 78%);
        transform: translateY(-50%);
        filter: blur(1px);
        opacity: 0.95;
    }
`,

    timelineStep: css`
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 0 4px;
        background: transparent;
        border: none;
        color: ${colors.slateLight};
        cursor: pointer;
        text-align: center;
        transition:
            transform 280ms ease,
            color 280ms ease;

        &[data-active="true"] {
            color: ${colors.white};
        }

        &:hover {
            transform: translateY(-3px);
        }
    `,

    timelineStepActive: css`
        color: ${colors.white};
    `,

    timelineIconWrap: css`
        position: relative;
        z-index: 1;
        width: 62px;
        height: 62px;
        border-radius: 50%;
        background: linear-gradient(180deg, rgba(22, 37, 64, 1) 0%, rgba(13, 27, 46, 1) 100%);
        border: 2px solid rgba(196, 207, 222, 0.58);
        display: flex;
        align-items: center;
        justify-content: center;
        transition:
            background 340ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 340ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 340ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 340ms cubic-bezier(0.22, 1, 0.36, 1);
        will-change: transform, box-shadow, background;
    `,

    timelineIconWrapActive: css`
        background: linear-gradient(180deg, ${colors.amberLight} 0%, ${colors.amber} 100%);
        border-color: transparent;
        box-shadow:
            0 16px 30px rgba(224, 123, 42, 0.24),
            0 0 0 1px rgba(240, 144, 64, 0.18),
            0 0 22px rgba(224, 123, 42, 0.18);
        transform: scale(1.06);
    `,

    timelineNumber: css`
        font-size: 1rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: inherit;
    `,

    timelineNumberActive: css`
        color: ${colors.white};
    `,

    timelineIcon: css`
        position: absolute;
        bottom: -8px;
        right: -6px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${colors.navy};
        color: ${colors.amber};
        border: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 0.78rem;
    `,

    timelineTitle: css`
        color: inherit;
        font-size: 0.9rem;
        font-weight: 700;
        line-height: 1.35;
        text-wrap: balance;
    `,

    panelTitle: css`
        margin: 0;
        color: ${colors.white};
        font-family: ${typography.fontDisplay};
        font-size: 2.15rem;
        font-weight: 650;
        letter-spacing: -0.03em;
        line-height: 1;

        @media (max-width: 768px) {
            font-size: 1.85rem;
        }
    `,

    panelTag: css`
        width: fit-content;
        border-radius: ${radius.pill}px;
        border: 1px solid ${colors.borderNavy};
        background: rgba(255, 255, 255, 0.04);
        color: ${colors.amberMuted};
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 8px 12px;
    `,

    panelTitleMed: css`
        color: ${colors.white};
    `,

    panelTitleStream: css`
        color: ${colors.amber};
        font-style: italic;
    `,

    featureViewport: css`
        position: relative;
        min-height: 260px;
        height: 100%;
        padding: 24px 22px 22px;
        border-radius: ${radius.md}px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.025) 100%);
        border: 1px solid ${colors.borderNavy};
        overflow: hidden;
        display: grid;
        align-content: start;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.04),
            0 16px 30px rgba(5, 10, 20, 0.18);

        @media (max-width: 768px) {
            min-height: 240px;
        }
    `,

    featureCard: css`
    height: 100%;
    will-change: opacity, transform, filter;
    transition:
        opacity 420ms cubic-bezier(0.22, 1, 0.36, 1),
        transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
        filter 420ms cubic-bezier(0.22, 1, 0.36, 1);
`,

featureCardEntering: css`
    opacity: 1;
    transform: translate3d(0, 0, 0);
    filter: blur(0);
`,

featureCardLeaving: css`
    opacity: 0.18;
    transform: translate3d(18px, 0, 0);
    filter: blur(4px);
`,

    featureHeadingRow: css`
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 16px;
    `,

    featureIcon: css`
        width: 52px;
        height: 52px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(224, 123, 42, 0.12);
        border: 1px solid rgba(224, 123, 42, 0.18);
        color: ${colors.amber};
        font-size: 1.5rem;
        flex-shrink: 0;
        box-shadow:
            0 10px 22px rgba(224, 123, 42, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
    `,

    featureTitle: css`
        margin: 2px 0 0;
        color: ${colors.white};
        font-size: 1.55rem;
        font-weight: 800;
        line-height: 1.12;

        @media (max-width: 768px) {
            font-size: 1.35rem;
        }
    `,

    featureMeta: css`
        margin: 0;
        color: ${colors.amberMuted};
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    `,

    featureDescription: css`
        margin: 0;
        color: ${colors.slateLight};
        font-size: 1.18rem;
        line-height: 1.72;
        max-width: 29rem;
    `,

    authPlaceholder: css`
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
            radial-gradient(circle at top left, ${colors.amberPale} 0%, rgba(253, 240, 228, 0) 32%),
            linear-gradient(180deg, ${colors.white} 0%, ${colors.offWhite} 100%);
        color: ${colors.navy};
        font-size: 1.2rem;
        font-weight: 700;
    `,

    "@keyframes medstreamFeatureIn": {
        "0%": {
            opacity: 0,
            transform: "translate3d(20px, 0, 0) scale(0.985)",
            filter: "blur(4px)",
        },
        "60%": {
            opacity: 1,
            transform: "translate3d(0, 0, 0) scale(1)",
            filter: "blur(0)",
        },
        "100%": {
            opacity: 1,
            transform: "translate3d(0, 0, 0) scale(1)",
            filter: "blur(0)",
        },
    },

    "@keyframes medstreamGlowFloat": {
        "0%": {
            transform: "translate3d(0, 0, 0) scale(1)",
        },
        "50%": {
            transform: "translate3d(-18px, -14px, 0) scale(1.28)",
        },
        "100%": {
            transform: "translate3d(0, 0, 0) scale(1)",
        },
    },
}));
