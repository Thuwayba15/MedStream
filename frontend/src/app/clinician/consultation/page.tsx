import { Card, Space } from "antd";
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
                <Space orientation="vertical" size={10}>
                    <h1>Consultation</h1>
                    <p>Consultation workspace is wired for queue handoff. Start from queue review to carry active visit context.</p>
                    <p>Visit Id: {params.visitId ?? "-"}</p>
                    <p>Queue Ticket Id: {params.queueTicketId ?? "-"}</p>
                </Space>
            </Card>
        </RoleAppShell>
    );
};

export default ClinicianConsultationPage;
