"use client";

import { ClinicianQueueDashboard } from "@/components/clinician/clinicianQueueDashboard";
import { ClinicianWorkspaceShell } from "@/components/clinician/clinicianWorkspaceShell";
import { RoleAppShell } from "@/components/layout/roleAppShell";
import { ClinicianQueueProvider } from "@/providers/clinician-queue";

const ClinicianHomePage = () => {
    return (
        <RoleAppShell roleLabel="Clinician" items={[]}>
            <ClinicianQueueProvider>
                <ClinicianWorkspaceShell activeKey="queue">
                    <ClinicianQueueDashboard />
                </ClinicianWorkspaceShell>
            </ClinicianQueueProvider>
        </RoleAppShell>
    );
};

export default ClinicianHomePage;
