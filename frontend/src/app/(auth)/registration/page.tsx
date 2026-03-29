import { RegistrationForm } from "@/components/auth/registrationForm";
import { RegistrationProvider } from "@/providers/registration";

const RegistrationPage = () => {
    return (
        <RegistrationProvider>
            <RegistrationForm />
        </RegistrationProvider>
    );
};

export default RegistrationPage;
