import { UserApprovalPage } from "@/components/admin/userApprovalPage";
import { AdminGovernanceProvider } from "@/providers/admin-governance";

const AdminPage = () => {
    return (
        <AdminGovernanceProvider>
            <UserApprovalPage />
        </AdminGovernanceProvider>
    );
};

export default AdminPage;
