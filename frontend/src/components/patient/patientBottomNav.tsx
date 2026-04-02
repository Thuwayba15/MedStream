"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { readPersistedQueuedVisit, subscribeToPersistedQueuedVisit } from "@/lib/patient-intake/providerHelpers";
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
    const router = useRouter();
    const hasPersistedQueue = useSyncExternalStore(
        subscribeToPersistedQueuedVisit,
        () => Boolean(readPersistedQueuedVisit()?.visitId),
        () => false
    );

    const canOpenQueue = hasQueueStatus || hasPersistedQueue;

    return (
        <div className={styles.bottomNavWrap} data-testid="patient-bottom-nav">
            <div className={styles.navRow}>
                <Link
                    href="/patient"
                    className={`${styles.navButton} ${activeKey === "new-visit" ? styles.navButtonActive : ""}`}
                    data-testid="patient-nav-new-visit"
                    aria-current={activeKey === "new-visit" ? "page" : undefined}
                    onClick={onSelectNewVisit}
                >
                    New Visit
                </Link>
                <button
                    type="button"
                    className={`${styles.navButton} ${activeKey === "my-queue" ? styles.navButtonActive : ""} ${!canOpenQueue ? styles.navButtonDisabled : ""}`}
                    data-testid="patient-nav-my-queue"
                    aria-disabled={!canOpenQueue}
                    aria-current={activeKey === "my-queue" ? "page" : undefined}
                    onClick={() => {
                        if (!canOpenQueue) {
                            return;
                        }

                        onSelectMyQueue?.();
                        router.push("/patient");
                    }}
                >
                    My Queue
                </button>
                <Link
                    href="/patient/history"
                    className={`${styles.navButton} ${activeKey === "history" ? styles.navButtonActive : ""}`}
                    data-testid="patient-nav-history"
                    aria-current={activeKey === "history" ? "page" : undefined}
                >
                    History
                </Link>
            </div>
        </div>
    );
};
