"use client";

import { ClinicianConsultationProvider } from "@/providers/clinician-consultation";
import { ClinicianHistoryProvider } from "@/providers/clinician-history";

export const ClinicianWorkspaceProviders = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
    return (
        <ClinicianConsultationProvider>
            <ClinicianHistoryProvider>{children}</ClinicianHistoryProvider>
        </ClinicianConsultationProvider>
    );
};
