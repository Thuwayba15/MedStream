namespace MedStream.Authorization.Accounts.Dto;

public class RegisterOutput
{
    public bool CanLogin { get; set; }

    public string RegistrationRole { get; set; }

    public bool IsClinicianApprovalPending { get; set; }

    public string AuthState { get; set; }
}
