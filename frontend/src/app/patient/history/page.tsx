"use client";

import { RoleAppShell } from "@/components/layout/roleAppShell";
import { PatientHistoryPage as PatientHistoryWorkspace } from "@/components/patient/patientHistoryPage";
import { PatientHistoryProvider } from "@/providers/patient-history";

const PatientHistoryRoutePage = () => {
    return (
        <RoleAppShell roleLabel="Patient" activeKey="patient-history" items={[]}>
            <PatientHistoryProvider>
                <PatientHistoryWorkspace />
            </PatientHistoryProvider>
        </RoleAppShell>
    );
};

export default PatientHistoryRoutePage;
