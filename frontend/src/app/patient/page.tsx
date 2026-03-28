"use client";

import { RoleAppShell } from "@/components/layout/roleAppShell";
import { PatientIntakePage } from "@/components/patient-intake/patientIntakePage";
import { PatientIntakeProvider } from "@/providers/patient-intake";

const PatientHomePage = (): React.JSX.Element => {
    return (
        <RoleAppShell roleLabel="Patient" activeKey="patient-new-visit" items={[{ key: "patient-new-visit", label: "New Visit", href: "/patient" }]}>
            <PatientIntakeProvider>
                <PatientIntakePage />
            </PatientIntakeProvider>
        </RoleAppShell>
    );
};

export default PatientHomePage;
