import type { PropsWithChildren } from "react";
import { requireRouteAuthState } from "@/lib/server/pageAuthGuard";

export default async function AwaitingApprovalLayout({ children }: PropsWithChildren): Promise<React.JSX.Element> {
    await requireRouteAuthState(["clinician_pending_approval"]);
    return <>{children}</>;
}
