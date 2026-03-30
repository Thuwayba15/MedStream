import { Card, Space, Typography } from "antd";
import { clinicianNavigationItems } from "@/components/clinician/navigation";
import { RoleAppShell } from "@/components/layout/roleAppShell";

interface IClinicianConsultationPageProps {
    searchParams: Promise<{
        visitId?: string;
        queueTicketId?: string;
    }>;
}

const ClinicianConsultationPage = async ({ searchParams }: IClinicianConsultationPageProps): Promise<React.JSX.Element> => {
    const params = await searchParams;

    return (
        <RoleAppShell roleLabel="Clinician" activeKey="clinician-consultation" items={clinicianNavigationItems}>
            <Card>
                <Space direction="vertical" size={10}>
                    <Typography.Title level={3}>Consultation</Typography.Title>
                    <Typography.Paragraph type="secondary">
                        Consultation workspace is wired for queue handoff. Start from queue review to carry active visit context.
                    </Typography.Paragraph>
                    <Typography.Text>Visit Id: {params.visitId ?? "-"}</Typography.Text>
                    <Typography.Text>Queue Ticket Id: {params.queueTicketId ?? "-"}</Typography.Text>
                </Space>
            </Card>
        </RoleAppShell>
    );
};

export default ClinicianConsultationPage;
