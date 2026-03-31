"use client";

import { ClinicianQueueDashboard } from "@/components/clinician/clinicianQueueDashboard";
import { ClinicianWorkspaceShell } from "@/components/clinician/clinicianWorkspaceShell";
import { RoleAppShell } from "@/components/layout/roleAppShell";
import { ClinicianQueueProvider } from "@/providers/clinician-queue";

const ClinicianHomePage = () => {
    return (
        <RoleAppShell roleLabel="Clinician" items={[]}>
            <ClinicianQueueProvider>
                <ClinicianWorkspaceShell activeKey="queue" title="Clinician Workspace" subtitle="Manage the live queue, pick up consultations, and return to patients you have already seen today.">
                    <ClinicianQueueDashboard />
                </ClinicianWorkspaceShell>
            </ClinicianQueueProvider>
        </RoleAppShell>
    );
};

export default ClinicianHomePage;
