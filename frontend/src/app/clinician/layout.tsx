import type { PropsWithChildren } from "react";
import { requireRouteAuthState } from "@/lib/server/pageAuthGuard";
import { ClinicianWorkspaceProviders } from "./clinicianWorkspaceProviders";

const ClinicianLayout = async ({ children }: PropsWithChildren) => {
    await requireRouteAuthState(["clinician_approved"]);
    return <ClinicianWorkspaceProviders>{children}</ClinicianWorkspaceProviders>;
};

export default ClinicianLayout;
