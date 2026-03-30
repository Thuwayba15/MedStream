"use client";

import { ClinicianQueueDashboard } from "@/components/clinician/clinicianQueueDashboard";
import { RoleAppShell } from "@/components/layout/roleAppShell";
import { ClinicianQueueProvider } from "@/providers/clinician-queue";

const ClinicianHomePage = () => {
    return (
        <RoleAppShell roleLabel="Clinician" activeKey="clinician-queue-dashboard" items={[{ key: "clinician-queue-dashboard", label: "Queue Dashboard", href: "/clinician" }]}>
            <ClinicianQueueProvider>
                <ClinicianQueueDashboard />
            </ClinicianQueueProvider>
        </RoleAppShell>
    );
};

export default ClinicianHomePage;
