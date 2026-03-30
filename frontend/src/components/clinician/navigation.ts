import type { IRoleSidebarItem } from "@/components/layout/roleAppShell";

export const clinicianNavigationItems: IRoleSidebarItem[] = [
    {
        key: "clinician-queue-dashboard",
        label: "Queue Dashboard",
        href: "/clinician",
    },
    {
        key: "clinician-consultation",
        label: "Consultation",
        href: "/clinician/consultation",
    },
    {
        key: "clinician-history",
        label: "Patient History",
        href: "/clinician/history",
    },
];
