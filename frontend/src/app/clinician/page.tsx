"use client";

import { ClinicianQueueDashboard } from "@/components/clinician/clinicianQueueDashboard";
import { clinicianNavigationItems } from "@/components/clinician/navigation";
import { RoleAppShell } from "@/components/layout/roleAppShell";
import { ClinicianQueueProvider } from "@/providers/clinician-queue";

const ClinicianHomePage = () => {
    return (
        <RoleAppShell roleLabel="Clinician" activeKey="clinician-queue-dashboard" items={clinicianNavigationItems}>
            <ClinicianQueueProvider>
                <ClinicianQueueDashboard />
            </ClinicianQueueProvider>
        </RoleAppShell>
    );
};

export default ClinicianHomePage;
