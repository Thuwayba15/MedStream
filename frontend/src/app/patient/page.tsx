"use client";

import { RoleAppShell } from "@/components/layout/roleAppShell";
import { PatientIntakePage } from "@/components/patient-intake/patientIntakePage";
import { PatientIntakeProvider } from "@/providers/patient-intake";

const PatientHomePage = () => {
    return (
        <RoleAppShell roleLabel="Patient" activeKey="patient-new-visit" items={[]}>
            <PatientIntakeProvider>
                <PatientIntakePage />
            </PatientIntakeProvider>
        </RoleAppShell>
    );
};

export default PatientHomePage;
