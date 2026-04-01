import { ClinicianHistoryPage as ClinicianHistoryWorkspace } from "@/components/clinician/clinicianHistoryPage";
import { ClinicianWorkspaceShell } from "@/components/clinician/clinicianWorkspaceShell";
import { RoleAppShell } from "@/components/layout/roleAppShell";

interface IClinicianHistoryPageProps {
    searchParams: Promise<{
        patientUserId?: string;
        visitId?: string;
        queueTicketId?: string;
    }>;
}

const ClinicianHistoryPage = async ({ searchParams }: IClinicianHistoryPageProps): Promise<React.JSX.Element> => {
    const params = await searchParams;
    const patientUserId = params.patientUserId ? Number(params.patientUserId) : undefined;
    const visitId = params.visitId ? Number(params.visitId) : undefined;
    const queueTicketId = params.queueTicketId ? Number(params.queueTicketId) : undefined;

    return (
        <RoleAppShell roleLabel="Clinician" items={[]}>
            <ClinicianWorkspaceShell
                activeKey="history"
                consultationVisitId={visitId}
                consultationQueueTicketId={queueTicketId}
                historyPatientUserId={patientUserId}
                historyVisitId={visitId}
                title="Patient Timeline"
                subtitle="Review cross-facility triage and consultation history for the active patient."
            >
                <ClinicianHistoryWorkspace patientUserId={patientUserId} />
            </ClinicianWorkspaceShell>
        </RoleAppShell>
    );
};

export default ClinicianHistoryPage;
