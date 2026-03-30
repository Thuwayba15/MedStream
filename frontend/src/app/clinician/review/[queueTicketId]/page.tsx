import { ClinicianTriageReviewPage } from "@/components/clinician/clinicianTriageReviewPage";
import { clinicianNavigationItems } from "@/components/clinician/navigation";
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
        <RoleAppShell roleLabel="Clinician" activeKey="clinician-queue-dashboard" items={clinicianNavigationItems}>
            <ClinicianQueueReviewProvider>
                <ClinicianTriageReviewPage queueTicketId={Number.isInteger(parsedQueueTicketId) ? parsedQueueTicketId : 0} />
            </ClinicianQueueReviewProvider>
        </RoleAppShell>
    );
};

export default ClinicianReviewPage;
