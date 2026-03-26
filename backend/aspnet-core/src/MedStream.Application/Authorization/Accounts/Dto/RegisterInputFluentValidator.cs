using Abp.Authorization.Users;
using FluentValidation;
using MedStream.Authorization.Users;

namespace MedStream.Authorization.Accounts.Dto;

public class RegisterInputFluentValidator : AbstractValidator<RegisterInput>
{
    private const string SouthAfricaPhonePattern = @"^(\+27|0)[6-8][0-9]{8}$";
    private const string SouthAfricaIdPattern = @"^[0-9]{13}$";
    private const string SouthAfricaRegistrationNumberPattern = @"^[A-Za-z0-9][A-Za-z0-9\-\/]{2,31}$";
    private const string StrongPasswordPattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$";

    public RegisterInputFluentValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty()
            .MaximumLength(AbpUserBase.MaxNameLength);

        RuleFor(x => x.LastName)
            .NotEmpty()
            .MaximumLength(AbpUserBase.MaxSurnameLength);

        RuleFor(x => x.EmailAddress)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(AbpUserBase.MaxEmailAddressLength);

        RuleFor(x => x.PhoneNumber)
            .NotEmpty()
            .MaximumLength(AbpUserBase.MaxPhoneNumberLength)
            .Matches(SouthAfricaPhonePattern)
            .WithMessage("Phone number must be a valid South African mobile number.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .MaximumLength(AbpUserBase.MaxPlainPasswordLength)
            .MinimumLength(8)
            .Matches(StrongPasswordPattern)
            .WithMessage("Password must include upper, lower, and a number.");

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty()
            .MaximumLength(AbpUserBase.MaxPlainPasswordLength)
            .Equal(x => x.Password)
            .WithMessage("Password and confirm password do not match.");

        RuleFor(x => x.DateOfBirth)
            .Must(date => !date.HasValue || date.Value.Date <= System.DateTime.UtcNow.Date)
            .WithMessage("Date of birth cannot be in the future.");

        RuleFor(x => x.IdNumber)
            .Must(value => string.IsNullOrWhiteSpace(value) || System.Text.RegularExpressions.Regex.IsMatch(value, SouthAfricaIdPattern))
            .WithMessage("ID number must be exactly 13 digits.");

        RuleFor(x => x.AccountType)
            .NotEmpty()
            .Must(IsAllowedAccountType)
            .WithMessage("Account type must be either Patient or Clinician.");

        RuleFor(x => x.ProfessionType)
            .Must(BeNullOrAllowedProfessionType)
            .WithMessage("Profession type must be Doctor, Nurse, AlliedHealth, or Other.");

        RuleFor(x => x.RegulatoryBody)
            .Must(BeNullOrAllowedRegulatoryBody)
            .WithMessage("Regulatory body must be HPCSA, SANC, or Other.");

        When(
            x => string.Equals(x.AccountType, UserRegistrationConstants.AccountTypeClinician, System.StringComparison.OrdinalIgnoreCase),
            () =>
            {
                RuleFor(x => x.IdNumber)
                    .NotEmpty()
                    .WithMessage("ID number is required for clinician registration.")
                    .Matches(SouthAfricaIdPattern)
                    .WithMessage("ID number must be exactly 13 digits.");

                RuleFor(x => x.ProfessionType)
                    .NotEmpty()
                    .WithMessage("Profession type is required for clinician registration.");

                RuleFor(x => x.RegulatoryBody)
                    .NotEmpty()
                    .WithMessage("Regulatory body is required for clinician registration.");

                RuleFor(x => x.RegistrationNumber)
                    .NotEmpty()
                    .WithMessage("Registration number is required for clinician registration.")
                    .Matches(SouthAfricaRegistrationNumberPattern)
                    .WithMessage("Registration number must be a valid SA registration format.");

                RuleFor(x => x.RequestedFacility)
                    .MaximumLength(128);

                RuleFor(x => x.RequestedFacilityId)
                    .NotNull()
                    .WithMessage("Requested facility is required for clinician registration.")
                    .GreaterThan(0)
                    .WithMessage("Requested facility is required for clinician registration.");
            });
    }

    private static bool IsAllowedAccountType(string value)
    {
        return value != null
            && (value.Equals(UserRegistrationConstants.AccountTypePatient, System.StringComparison.OrdinalIgnoreCase)
            || value.Equals(UserRegistrationConstants.AccountTypeClinician, System.StringComparison.OrdinalIgnoreCase));
    }

    private static bool BeNullOrAllowedProfessionType(string value)
    {
        return string.IsNullOrWhiteSpace(value)
            || value.Equals(UserRegistrationConstants.ProfessionTypeDoctor, System.StringComparison.OrdinalIgnoreCase)
            || value.Equals(UserRegistrationConstants.ProfessionTypeNurse, System.StringComparison.OrdinalIgnoreCase)
            || value.Equals(UserRegistrationConstants.ProfessionTypeAlliedHealth, System.StringComparison.OrdinalIgnoreCase)
            || value.Equals(UserRegistrationConstants.ProfessionTypeOther, System.StringComparison.OrdinalIgnoreCase);
    }

    private static bool BeNullOrAllowedRegulatoryBody(string value)
    {
        return string.IsNullOrWhiteSpace(value)
            || value.Equals(UserRegistrationConstants.RegulatoryBodyHpcsa, System.StringComparison.OrdinalIgnoreCase)
            || value.Equals(UserRegistrationConstants.RegulatoryBodySanc, System.StringComparison.OrdinalIgnoreCase)
            || value.Equals(UserRegistrationConstants.RegulatoryBodyOther, System.StringComparison.OrdinalIgnoreCase);
    }
}
