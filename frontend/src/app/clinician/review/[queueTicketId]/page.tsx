"use client";

import { ArrowLeftOutlined, FileSearchOutlined } from "@ant-design/icons";
import { Button, Card, Space, Typography } from "antd";
import Link from "next/link";
import { useParams } from "next/navigation";

const ClinicianTriageReviewPage = (): React.JSX.Element => {
    const params = useParams<{ queueTicketId: string }>();
    const queueTicketId = params.queueTicketId ?? "-";

    return (
        <Card>
            <Space orientation="vertical" size={14}>
                <Typography.Title level={3}>Triage Review</Typography.Title>
                <Typography.Paragraph type="secondary">
                    Queue ticket #{queueTicketId} selected. Full triage review and consultation handoff screen lands in the next issue.
                </Typography.Paragraph>
                <Space>
                    <Link href="/clinician">
                        <Button icon={<ArrowLeftOutlined />}>Back to Queue</Button>
                    </Link>
                    <Button type="primary" icon={<FileSearchOutlined />} disabled>
                        Confirm & Start Consultation
                    </Button>
                </Space>
            </Space>
        </Card>
    );
};

export default ClinicianTriageReviewPage;

