import type { PropsWithChildren } from "react";
import { requireRouteAuthState } from "@/lib/server/pageAuthGuard";

const PatientLayout = async ({ children }: PropsWithChildren): Promise<React.JSX.Element> => {
    await requireRouteAuthState(["patient"]);
    return <>{children}</>;
};

export default PatientLayout;
