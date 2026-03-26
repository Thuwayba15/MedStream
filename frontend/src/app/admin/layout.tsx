import type { PropsWithChildren } from "react";
import { requireRouteAuthState } from "@/lib/server/pageAuthGuard";

export default async function AdminLayout({ children }: PropsWithChildren): Promise<React.JSX.Element> {
    await requireRouteAuthState(["admin"]);
    return <>{children}</>;
}
