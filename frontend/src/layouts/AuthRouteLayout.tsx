import type { PropsWithChildren } from "react";

/**
 * Route-level layout wrapper for authentication pages.
 * Keep this file focused on composition; auth page visuals stay inside auth components.
 */
export const AuthRouteLayout = ({ children }: PropsWithChildren) => {
    return <>{children}</>;
};
