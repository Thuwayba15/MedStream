import type { PropsWithChildren } from "react";
import { requireRouteAuthState } from "@/lib/server/pageAuthGuard";

const AwaitingApprovalLayout = async ({ children }: PropsWithChildren) => {
    await requireRouteAuthState(["clinician_pending_approval"]);
    return <>{children}</>;
};

export default AwaitingApprovalLayout;
