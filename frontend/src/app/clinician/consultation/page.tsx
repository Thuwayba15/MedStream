import { ClinicianConsultationPage as ClinicianConsultationWorkspace } from "@/components/clinician/clinicianConsultationPage";
import { ClinicianWorkspaceShell } from "@/components/clinician/clinicianWorkspaceShell";
import { RoleAppShell } from "@/components/layout/roleAppShell";

interface IClinicianConsultationPageProps {
    searchParams: Promise<{
        visitId?: string;
        queueTicketId?: string;
        patientUserId?: string;
    }>;
}

const ClinicianConsultationPage = async ({ searchParams }: IClinicianConsultationPageProps): Promise<React.JSX.Element> => {
    const params = await searchParams;
    const visitId = params.visitId ? Number(params.visitId) : undefined;
    const queueTicketId = params.queueTicketId ? Number(params.queueTicketId) : undefined;
    const patientUserId = params.patientUserId ? Number(params.patientUserId) : undefined;

    return (
        <RoleAppShell roleLabel="Clinician" items={[]}>
            <ClinicianWorkspaceShell
                activeKey="consultation"
                reviewQueueTicketId={queueTicketId}
                consultationVisitId={visitId}
                consultationQueueTicketId={queueTicketId}
                historyPatientUserId={patientUserId}
                historyVisitId={visitId}
                title="Consultation Workspace"
                subtitle="Open an active visit or return to today's drafted and completed consultations."
            >
                <ClinicianConsultationWorkspace visitId={visitId} queueTicketId={queueTicketId} patientUserId={patientUserId} />
            </ClinicianWorkspaceShell>
        </RoleAppShell>
    );
};

export default ClinicianConsultationPage;
