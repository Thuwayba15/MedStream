namespace MedStream.Authorization.Users;

public static class UserRegistrationConstants
{
    public const string AccountTypePatient = "Patient";
    public const string AccountTypeClinician = "Clinician";

    public const string ProfessionTypeDoctor = "Doctor";
    public const string ProfessionTypeNurse = "Nurse";
    public const string ProfessionTypeAlliedHealth = "AlliedHealth";
    public const string ProfessionTypeOther = "Other";

    public const string RegulatoryBodyHpcsa = "HPCSA";
    public const string RegulatoryBodySanc = "SANC";
    public const string RegulatoryBodyOther = "Other";

    public const string ApprovalStatusPending = "PendingApproval";
    public const string ApprovalStatusApproved = "Approved";
    public const string ApprovalStatusRejected = "Rejected";
}
