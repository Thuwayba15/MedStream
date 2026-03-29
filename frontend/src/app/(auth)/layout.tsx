import type { PropsWithChildren } from "react";
import { AuthRouteLayout } from "@/layouts/AuthRouteLayout";
import { requireGuestRoute } from "@/lib/server/pageAuthGuard";

const Layout = async ({ children }: PropsWithChildren) => {
    await requireGuestRoute();
    return <AuthRouteLayout>{children}</AuthRouteLayout>;
};

export default Layout;
