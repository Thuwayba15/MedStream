"use client";

import { Button } from "antd";
import Link from "next/link";
import { usePatientBottomNavStyles } from "./patientBottomNavStyle";

type TPatientNavKey = "new-visit" | "my-queue" | "history";

interface IPatientBottomNavProps {
    activeKey: TPatientNavKey;
    hasQueueStatus: boolean;
    onSelectNewVisit?: () => void;
    onSelectMyQueue?: () => void;
}

export const PatientBottomNav = ({ activeKey, hasQueueStatus, onSelectMyQueue, onSelectNewVisit }: IPatientBottomNavProps): React.JSX.Element => {
    const { styles } = usePatientBottomNavStyles();

    return (
        <div className={styles.bottomNavWrap} data-testid="patient-bottom-nav">
            <div className={styles.navRow}>
                <Link href="/patient">
                    <Button
                        className={`${styles.navButton} ${activeKey === "new-visit" ? styles.navButtonActive : ""}`}
                        data-testid="patient-nav-new-visit"
                        onClick={() => onSelectNewVisit?.()}
                    >
                        New Visit
                    </Button>
                </Link>
                <Link href="/patient">
                    <Button
                        className={`${styles.navButton} ${activeKey === "my-queue" ? styles.navButtonActive : ""}`}
                        data-testid="patient-nav-my-queue"
                        disabled={!hasQueueStatus}
                        onClick={() => onSelectMyQueue?.()}
                    >
                        My Queue
                    </Button>
                </Link>
                <Link href="/patient/history">
                    <Button className={`${styles.navButton} ${activeKey === "history" ? styles.navButtonActive : ""}`} data-testid="patient-nav-history">
                        History
                    </Button>
                </Link>
            </div>
        </div>
    );
};
