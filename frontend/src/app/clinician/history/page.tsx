import { Card, Space } from "antd";
import { ClinicianWorkspaceShell } from "@/components/clinician/clinicianWorkspaceShell";
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
        <RoleAppShell roleLabel="Clinician" items={[]}>
            <ClinicianWorkspaceShell activeKey="history" title="Clinician Workspace" subtitle="Review the patient timeline for visits you have access to.">
                <Card>
                    <Space orientation="vertical" size={10}>
                        <h1>Patient History</h1>
                        <p>Patient timeline and historical context route. Open from queue review to scope to the selected patient.</p>
                        <p>Patient User Id: {params.patientUserId ?? "-"}</p>
                        <p>Visit Id: {params.visitId ?? "-"}</p>
                    </Space>
                </Card>
            </ClinicianWorkspaceShell>
        </RoleAppShell>
    );
};

export default ClinicianHistoryPage;
