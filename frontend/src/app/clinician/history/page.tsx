import { Card, Space } from "antd";
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
                <Space orientation="vertical" size={10}>
                    <h1>Patient History</h1>
                    <p>Patient timeline and historical context route. Open from queue review to scope to the selected patient.</p>
                    <p>Patient User Id: {params.patientUserId ?? "-"}</p>
                    <p>Visit Id: {params.visitId ?? "-"}</p>
                </Space>
            </Card>
        </RoleAppShell>
    );
};

export default ClinicianHistoryPage;
