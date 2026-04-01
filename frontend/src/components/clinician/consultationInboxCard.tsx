"use client";

import { Button, Card, Space, Tag, Typography } from "antd";
import Link from "next/link";
import type { IConsultationInboxItem } from "@/services/consultation/types";
import { buildInboxMeta, formatVisitStartedAt, getUrgencyClassName } from "./consultationHelpers";

interface IConsultationInboxCardProps {
    item: IConsultationInboxItem;
    styles: Record<string, string>;
}

export const ConsultationInboxCard = ({ item, styles }: IConsultationInboxCardProps): React.JSX.Element => (
    <Card className={styles.inboxCard}>
        <div className={styles.inboxCardHeader}>
            <div>
                <Typography.Title level={4} className={styles.inboxPatientName}>
                    {item.patientName}
                </Typography.Title>
                <Typography.Text className={styles.helperText}>{formatVisitStartedAt(item.visitDate)}</Typography.Text>
            </div>
            <Space wrap size={8}>
                <Tag className={styles.queueTag}>{(item.queueStatus || "queue active").replaceAll("_", " ")}</Tag>
                <Tag className={getUrgencyClassName(item.urgencyLevel || "Routine", styles)}>Triage: {item.urgencyLevel || "Routine"}</Tag>
            </Space>
        </div>
        <Typography.Paragraph className={styles.inboxSummary}>{buildInboxMeta(item)}</Typography.Paragraph>
        <div className={styles.inboxMeta}>
            <span>Note: {item.encounterNoteStatus}</span>
            <span>{item.lastTranscriptAt || item.finalizedAt ? "Updated today" : "No recent update"}</span>
        </div>
        <Link href={item.consultationPath}>
            <Button type="primary" className={styles.primaryAction} block>
                {item.encounterNoteStatus === "draft" ? "Resume Draft" : "Open Note"}
            </Button>
        </Link>
    </Card>
);
