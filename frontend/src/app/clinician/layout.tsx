import type { PropsWithChildren } from "react";
import { requireRouteAuthState } from "@/lib/server/pageAuthGuard";

export default async function ClinicianLayout({ children }: PropsWithChildren): Promise<React.JSX.Element> {
    await requireRouteAuthState(["clinician_approved"]);
    return <>{children}</>;
}
