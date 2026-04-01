"use client";

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
                <Link
                    href="/patient"
                    className={`${styles.navButton} ${activeKey === "new-visit" ? styles.navButtonActive : ""}`}
                    data-testid="patient-nav-new-visit"
                    onClick={onSelectNewVisit}
                >
                    New Visit
                </Link>
                <button
                    type="button"
                    className={`${styles.navButton} ${activeKey === "my-queue" ? styles.navButtonActive : ""}`}
                    data-testid="patient-nav-my-queue"
                    disabled={!hasQueueStatus}
                    onClick={() => {
                        onSelectMyQueue?.();
                    }}
                >
                    My Queue
                </button>
                <Link href="/patient/history" className={`${styles.navButton} ${activeKey === "history" ? styles.navButtonActive : ""}`} data-testid="patient-nav-history">
                    History
                </Link>
            </div>
        </div>
    );
};
