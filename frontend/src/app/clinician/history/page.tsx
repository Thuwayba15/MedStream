import { Card, Space, Typography } from "antd";
import { clinicianNavigationItems } from "@/components/clinician/navigation";
import { RoleAppShell } from "@/components/layout/roleAppShell";

interface IClinicianHistoryPageProps {
    searchParams: Promise<{
        patientUserId?: string;
        visitId?: string;
    }>;
}

const ClinicianHistoryPage = async ({ searchParams }: IClinicianHistoryPageProps): Promise<React.JSX.Element> => {
    const params = await searchParams;

    return (
        <RoleAppShell roleLabel="Clinician" activeKey="clinician-history" items={clinicianNavigationItems}>
            <Card>
                <Space direction="vertical" size={10}>
                    <Typography.Title level={3}>Patient History</Typography.Title>
                    <Typography.Paragraph type="secondary">
                        Patient timeline and historical context route. Open from queue review to scope to the selected patient.
                    </Typography.Paragraph>
                    <Typography.Text>Patient User Id: {params.patientUserId ?? "-"}</Typography.Text>
                    <Typography.Text>Visit Id: {params.visitId ?? "-"}</Typography.Text>
                </Space>
            </Card>
        </RoleAppShell>
    );
};

export default ClinicianHistoryPage;
