"use client";

import Image from "next/image";
import { Button } from "antd";
import { FeatureSpotlight } from "./featureSpotlight";
import { useLandingStyles } from "./style";

export const LandingPage = () => {
    const { styles } = useLandingStyles();

    return (
        <main className={styles.page}>
            <div className={styles.shell}>
                <section className={styles.hero}>
                    <div className={styles.brandRow}>
                        <div className={styles.brandImageWrap}>
                            <Image src="/logo_ms.png" alt="MedStream brand mark" width={54} height={54} priority className={styles.brandImage} />
                        </div>
                        <div className={styles.logoText} aria-label="MedStream">
                            <span className={styles.logoMed}>Med</span>
                            <span className={styles.logoStream}>Stream</span>
                        </div>
                    </div>

                    <div className={styles.copyBlock}>
                        <h1 className={styles.title}>
                            Better care starts with <span className={styles.titleAccent}>better workflow</span>
                        </h1>
                        <p className={styles.description}>
                            MedStream brings intelligent patient intake, real-time queue management, and AI-assisted documentation to South African public clinics. Streamlining care where it matters
                            most.
                        </p>
                    </div>

                    <div className={styles.actions}>
                        <Button type="primary" size="large" href="/login" className={styles.primaryButton}>
                            Login
                        </Button>
                        <Button size="large" href="/registration" className={styles.secondaryButton}>
                            Sign Up
                        </Button>
                    </div>
                </section>

                <div className={styles.panelWrap}>
                    <FeatureSpotlight />
                </div>
            </div>
        </main>
    );
};
