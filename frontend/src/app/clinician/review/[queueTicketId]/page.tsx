import { ClinicianTriageReviewPage } from "@/components/clinician/clinicianTriageReviewPage";
import { ClinicianWorkspaceShell } from "@/components/clinician/clinicianWorkspaceShell";
import { RoleAppShell } from "@/components/layout/roleAppShell";
import { ClinicianQueueReviewProvider } from "@/providers/clinician-queue-review";

interface IClinicianReviewPageProps {
    params: Promise<{
        queueTicketId: string;
    }>;
}

const ClinicianReviewPage = async ({ params }: IClinicianReviewPageProps): Promise<React.JSX.Element> => {
    const { queueTicketId } = await params;
    const parsedQueueTicketId = Number(queueTicketId);

    return (
        <RoleAppShell roleLabel="Clinician" items={[]}>
            <ClinicianQueueReviewProvider>
                <ClinicianWorkspaceShell
                    activeKey="review"
                    reviewQueueTicketId={Number.isInteger(parsedQueueTicketId) ? parsedQueueTicketId : 0}
                    title="Clinician Workspace"
                    subtitle="Review triage reasoning, then move directly into the consultation note."
                >
                    <ClinicianTriageReviewPage queueTicketId={Number.isInteger(parsedQueueTicketId) ? parsedQueueTicketId : 0} />
                </ClinicianWorkspaceShell>
            </ClinicianQueueReviewProvider>
        </RoleAppShell>
    );
};

export default ClinicianReviewPage;
