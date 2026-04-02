"use client";

import { Card, Empty, Skeleton, Typography } from "antd";
import { ConsultationInboxCard } from "@/components/clinician/consultationInboxCard";
import type { IConsultationInboxItem } from "@/services/consultation/types";

interface IConsultationInboxStateProps {
    styles: Record<string, string>;
    inbox: IConsultationInboxItem[];
    isLoading: boolean;
}

export const ConsultationInboxState = ({ styles, inbox, isLoading }: IConsultationInboxStateProps): React.JSX.Element => {
    if (isLoading && inbox.length === 0) {
        return (
            <Card className={styles.panelCard}>
                <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
        );
    }

    if (inbox.length === 0) {
        return (
            <Card className={styles.emptyStateCard}>
                <Empty description="No consultations assigned to you yet today. Start from triage review to open a visit here." />
            </Card>
        );
    }

    return (
        <section className={styles.inboxSection}>
            <Typography.Title level={3} className={styles.pageSectionTitle}>
                Today&apos;s consultations
            </Typography.Title>
            <div className={styles.inboxGrid}>
                {inbox.map((item) => (
                    <ConsultationInboxCard key={item.consultationPath} item={item} styles={styles} />
                ))}
            </div>
        </section>
    );
};
