import { ClinicianConsultationPage as ClinicianConsultationWorkspace } from "@/components/clinician/clinicianConsultationPage";
import { ClinicianWorkspaceShell } from "@/components/clinician/clinicianWorkspaceShell";
import { RoleAppShell } from "@/components/layout/roleAppShell";
import { ClinicianConsultationProvider } from "@/providers/clinician-consultation";

interface IClinicianConsultationPageProps {
    searchParams: Promise<{
        visitId?: string;
        queueTicketId?: string;
    }>;
}

const ClinicianConsultationPage = async ({ searchParams }: IClinicianConsultationPageProps): Promise<React.JSX.Element> => {
    const params = await searchParams;
    const visitId = params.visitId ? Number(params.visitId) : undefined;
    const queueTicketId = params.queueTicketId ? Number(params.queueTicketId) : undefined;

    return (
        <RoleAppShell roleLabel="Clinician" items={[]}>
            <ClinicianConsultationProvider>
                <ClinicianWorkspaceShell
                    activeKey="consultation"
                    reviewQueueTicketId={queueTicketId}
                    title="Consultation Workspace"
                    subtitle="Open an active visit or return to today's drafted and completed consultations."
                >
                    <ClinicianConsultationWorkspace visitId={visitId} queueTicketId={queueTicketId} />
                </ClinicianWorkspaceShell>
            </ClinicianConsultationProvider>
        </RoleAppShell>
    );
};

export default ClinicianConsultationPage;
