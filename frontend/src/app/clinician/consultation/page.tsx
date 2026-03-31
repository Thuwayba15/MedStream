import { clinicianNavigationItems } from "@/components/clinician/navigation";
import { ClinicianConsultationPage as ClinicianConsultationWorkspace } from "@/components/clinician/clinicianConsultationPage";
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
        <RoleAppShell roleLabel="Clinician" activeKey="clinician-consultation" items={clinicianNavigationItems}>
            <ClinicianConsultationProvider>
                <ClinicianConsultationWorkspace visitId={visitId} queueTicketId={queueTicketId} />
            </ClinicianConsultationProvider>
        </RoleAppShell>
    );
};

export default ClinicianConsultationPage;
