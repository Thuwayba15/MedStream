"use client";

import Image from "next/image";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { landingFeatures } from "./content";
import { useLandingStyles } from "./style";

const FEATURE_ROTATION_MS = 3400;
const FEATURE_TRANSITION_MS = 420;

export function FeatureSpotlight(): React.JSX.Element {
    const { styles, cx } = useLandingStyles();

    const [displayIndex, setDisplayIndex] = useState<number>(0);
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

    const transitionTimeoutRef = useRef<number | null>(null);
    const displayIndexRef = useRef<number>(0);
    const isTransitioningRef = useRef<boolean>(false);

    useEffect(() => {
        displayIndexRef.current = displayIndex;
    }, [displayIndex]);

    useEffect(() => {
        isTransitioningRef.current = isTransitioning;
    }, [isTransitioning]);

    const changeFeature = useCallback((nextIndex: number) => {
        if (nextIndex === displayIndexRef.current || isTransitioningRef.current) {
            return;
        }

        isTransitioningRef.current = true;
        setIsTransitioning(true);

        if (transitionTimeoutRef.current) {
            window.clearTimeout(transitionTimeoutRef.current);
        }

        transitionTimeoutRef.current = window.setTimeout(() => {
            startTransition(() => {
                setDisplayIndex(nextIndex);
                setIsTransitioning(false);
            });
            isTransitioningRef.current = false;
            transitionTimeoutRef.current = null;
        }, FEATURE_TRANSITION_MS / 2);
    }, []);

    const selectFeatureFromUserInput = useCallback((nextIndex: number) => {
        if (nextIndex === displayIndexRef.current) {
            return;
        }

        if (transitionTimeoutRef.current) {
            window.clearTimeout(transitionTimeoutRef.current);
            transitionTimeoutRef.current = null;
        }

        isTransitioningRef.current = false;
        setIsTransitioning(false);
        setDisplayIndex(nextIndex);
    }, []);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            const nextIndex = (displayIndexRef.current + 1) % landingFeatures.length;
            changeFeature(nextIndex);
        }, FEATURE_ROTATION_MS);

        return () => {
            window.clearInterval(intervalId);

            if (transitionTimeoutRef.current) {
                window.clearTimeout(transitionTimeoutRef.current);
            }
        };
    }, [changeFeature]);

    const activeFeature = landingFeatures[displayIndex];
    const ActiveIcon = activeFeature.icon;

    return (
        <aside className={styles.panel} aria-labelledby="medstream-way-heading">
            <div className={styles.panelGlow} aria-hidden="true" />

            <div className={styles.panelHeaderStack}>
                <div className={styles.panelBrand}>
                    <Image src="/logo_inverted.png" alt="" width={34} height={44} className={styles.panelBrandImage} aria-hidden="true" />
                    <h2 id="medstream-way-heading" className={styles.panelTitle}>
                        <span className={styles.panelTitleMed}>The Med</span>
                        <span className={styles.panelTitleStream}>Stream</span>
                        <span className={styles.panelTitleMed}> Way</span>
                    </h2>
                </div>
                <span className={styles.panelTag}>One seamless connected flow</span>
            </div>

            <div className={styles.timeline} role="tablist" aria-label="MedStream workflow phases">
                <div className={styles.timelineRail} aria-hidden="true">
                    <span
                        className={styles.timelineRailProgress}
                        style={{
                            transform: `scaleX(${landingFeatures.length > 1 ? displayIndex / (landingFeatures.length - 1) : 1})`,
                        }}
                    />
                </div>

                {landingFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    const isActive = displayIndex === index;

                    return (
                        <button
                            key={feature.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-label={`Show ${feature.title}`}
                            data-active={isActive}
                            className={cx(styles.timelineStep, isActive && styles.timelineStepActive)}
                            onClick={() => {
                                selectFeatureFromUserInput(index);
                            }}
                        >
                            <span className={cx(styles.timelineIconWrap, isActive && styles.timelineIconWrapActive)}>
                                <span className={cx(styles.timelineNumber, isActive && styles.timelineNumberActive)}>{feature.stepNumber}</span>
                                <span className={styles.timelineIcon} aria-hidden="true">
                                    <Icon />
                                </span>
                            </span>
                            <span className={styles.timelineTitle}>{feature.title}</span>
                        </button>
                    );
                })}
            </div>

            <div className={styles.featureViewport}>
                <article className={cx(styles.featureCard, isTransitioning ? styles.featureCardLeaving : styles.featureCardEntering)}>
                    <div className={styles.featureHeadingRow}>
                        <div className={styles.featureIcon} aria-hidden="true">
                            <ActiveIcon />
                        </div>
                        <div>
                            <p className={styles.featureMeta}>Phase {activeFeature.stepNumber}</p>
                            <h3 className={styles.featureTitle}>{activeFeature.title}</h3>
                        </div>
                    </div>

                    <p className={styles.featureDescription}>{activeFeature.description}</p>
                </article>
            </div>
        </aside>
    );
}
