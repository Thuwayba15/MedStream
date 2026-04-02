import { ClinicianTriageReviewPage } from "@/components/clinician/clinicianTriageReviewPage";
import { ClinicianWorkspaceShell } from "@/components/clinician/clinicianWorkspaceShell";
import { RoleAppShell } from "@/components/layout/roleAppShell";
import { ClinicianQueueReviewProvider } from "@/providers/clinician-queue-review";

interface IClinicianReviewPageProps {
    params: Promise<{
        queueTicketId: string;
    }>;
    searchParams: Promise<{
        patientUserId?: string;
        visitId?: string;
    }>;
}

const ClinicianReviewPage = async ({ params, searchParams }: IClinicianReviewPageProps): Promise<React.JSX.Element> => {
    const { queueTicketId } = await params;
    const query = await searchParams;
    const parsedQueueTicketId = Number(queueTicketId);
    const patientUserId = query.patientUserId ? Number(query.patientUserId) : undefined;
    const visitId = query.visitId ? Number(query.visitId) : undefined;

    return (
        <RoleAppShell roleLabel="Clinician" items={[]}>
            <ClinicianQueueReviewProvider>
                <ClinicianWorkspaceShell
                    activeKey="review"
                    reviewQueueTicketId={Number.isInteger(parsedQueueTicketId) ? parsedQueueTicketId : 0}
                    consultationVisitId={visitId}
                    consultationQueueTicketId={Number.isInteger(parsedQueueTicketId) ? parsedQueueTicketId : undefined}
                    historyPatientUserId={patientUserId}
                    historyVisitId={visitId}
                >
                    <ClinicianTriageReviewPage queueTicketId={Number.isInteger(parsedQueueTicketId) ? parsedQueueTicketId : 0} />
                </ClinicianWorkspaceShell>
            </ClinicianQueueReviewProvider>
        </RoleAppShell>
    );
};

export default ClinicianReviewPage;
