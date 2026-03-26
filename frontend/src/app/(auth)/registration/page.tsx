import { RegistrationForm } from "@/components/auth/registrationForm";
import { RegistrationProvider } from "@/providers/registration";

export default function RegistrationPage() {
    return (
        <RegistrationProvider>
            <RegistrationForm />
        </RegistrationProvider>
    );
}
