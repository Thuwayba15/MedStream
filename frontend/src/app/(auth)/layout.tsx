import type { PropsWithChildren } from "react";
import { AuthRouteLayout } from "@/layouts/AuthRouteLayout";

export default function Layout({ children }: PropsWithChildren): React.JSX.Element {
    return <AuthRouteLayout>{children}</AuthRouteLayout>;
}
