import type { PropsWithChildren } from "react";
import { requireRouteAuthState } from "@/lib/server/pageAuthGuard";

export default async function PatientLayout({ children }: PropsWithChildren): Promise<React.JSX.Element> {
    await requireRouteAuthState(["patient"]);
    return <>{children}</>;
}
