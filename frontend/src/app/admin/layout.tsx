import type { PropsWithChildren } from "react";
import { requireRouteAuthState } from "@/lib/server/pageAuthGuard";

const AdminLayout = async ({ children }: PropsWithChildren) => {
    await requireRouteAuthState(["admin"]);
    return <>{children}</>;
};

export default AdminLayout;
