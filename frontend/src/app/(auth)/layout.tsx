import type { PropsWithChildren } from "react";
import { AuthRouteLayout } from "@/layouts/AuthRouteLayout";
import { requireGuestRoute } from "@/lib/server/pageAuthGuard";

export default async function Layout({ children }: PropsWithChildren): Promise<React.JSX.Element> {
    await requireGuestRoute();
    return <AuthRouteLayout>{children}</AuthRouteLayout>;
}
