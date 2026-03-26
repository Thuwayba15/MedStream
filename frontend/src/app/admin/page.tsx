import { UserApprovalPage } from "@/components/admin/userApprovalPage";
import { AdminGovernanceProvider } from "@/providers/admin-governance";

export default function AdminPage(): React.JSX.Element {
    return (
        <AdminGovernanceProvider>
            <UserApprovalPage />
        </AdminGovernanceProvider>
    );
}
