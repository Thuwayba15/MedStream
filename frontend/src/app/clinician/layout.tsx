import type { PropsWithChildren } from "react";
import { requireRouteAuthState } from "@/lib/server/pageAuthGuard";

const ClinicianLayout = async ({ children }: PropsWithChildren) => {
    await requireRouteAuthState(["clinician_approved"]);
    return <>{children}</>;
};

export default ClinicianLayout;
