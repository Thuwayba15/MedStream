using Abp.Auditing;
using Abp.Authorization.Users;
using Abp.Extensions;
using MedStream.Authorization.Users;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MedStream.Authorization.Accounts.Dto;

public class RegisterInput : IValidatableObject
{
    [Required]
    [StringLength(AbpUserBase.MaxNameLength)]
    public string FirstName { get; set; }

    [Required]
    [StringLength(AbpUserBase.MaxSurnameLength)]
    public string LastName { get; set; }

    [Required]
    [EmailAddress]
    [StringLength(AbpUserBase.MaxEmailAddressLength)]
    public string EmailAddress { get; set; }

    [Required]
    [StringLength(AbpUserBase.MaxPhoneNumberLength)]
    public string PhoneNumber { get; set; }

    [Required]
    [StringLength(AbpUserBase.MaxPlainPasswordLength)]
    [DisableAuditing]
    public string Password { get; set; }

    [Required]
    [StringLength(AbpUserBase.MaxPlainPasswordLength)]
    [DisableAuditing]
    public string ConfirmPassword { get; set; }

    [StringLength(32)]
    public string IdNumber { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [Required]
    [StringLength(32)]
    public string AccountType { get; set; }

    [StringLength(32)]
    public string ProfessionType { get; set; }

    [StringLength(32)]
    public string RegulatoryBody { get; set; }

    [StringLength(64)]
    public string RegistrationNumber { get; set; }

    [StringLength(128)]
    public string RequestedFacility { get; set; }

    public int? RequestedFacilityId { get; set; }

    [DisableAuditing]
    public string CaptchaResponse { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!string.Equals(Password, ConfirmPassword, StringComparison.Ordinal))
        {
            yield return new ValidationResult("Password and confirm password do not match.", new[] { nameof(ConfirmPassword) });
        }

        var isPatient = string.Equals(AccountType, UserRegistrationConstants.AccountTypePatient, StringComparison.OrdinalIgnoreCase);
        var isClinician = string.Equals(AccountType, UserRegistrationConstants.AccountTypeClinician, StringComparison.OrdinalIgnoreCase);
        if (!isPatient && !isClinician)
        {
            yield return new ValidationResult("Account type must be either Patient or Clinician.", new[] { nameof(AccountType) });
            yield break;
        }

        if (isClinician)
        {
            if (IdNumber.IsNullOrWhiteSpace())
            {
                yield return new ValidationResult("ID number is required for clinician registration.", new[] { nameof(IdNumber) });
            }

            if (ProfessionType.IsNullOrWhiteSpace())
            {
                yield return new ValidationResult("Profession type is required for clinician registration.", new[] { nameof(ProfessionType) });
            }
            else if (!IsAllowedProfessionType(ProfessionType))
            {
                yield return new ValidationResult("Profession type must be Doctor, Nurse, AlliedHealth, or Other.", new[] { nameof(ProfessionType) });
            }

            if (RegulatoryBody.IsNullOrWhiteSpace())
            {
                yield return new ValidationResult("Regulatory body is required for clinician registration.", new[] { nameof(RegulatoryBody) });
            }
            else if (!IsAllowedRegulatoryBody(RegulatoryBody))
            {
                yield return new ValidationResult("Regulatory body must be HPCSA, SANC, or Other.", new[] { nameof(RegulatoryBody) });
            }

            if (RegistrationNumber.IsNullOrWhiteSpace())
            {
                yield return new ValidationResult("Registration number is required for clinician registration.", new[] { nameof(RegistrationNumber) });
            }

            if (RequestedFacility.IsNullOrWhiteSpace())
            {
                if (!RequestedFacilityId.HasValue || RequestedFacilityId.Value <= 0)
                {
                    yield return new ValidationResult("Requested facility is required for clinician registration.", new[] { nameof(RequestedFacilityId) });
                }
            }
        }
    }

    private static bool IsAllowedProfessionType(string value)
    {
        return value.Equals(UserRegistrationConstants.ProfessionTypeDoctor, StringComparison.OrdinalIgnoreCase)
            || value.Equals(UserRegistrationConstants.ProfessionTypeNurse, StringComparison.OrdinalIgnoreCase)
            || value.Equals(UserRegistrationConstants.ProfessionTypeAlliedHealth, StringComparison.OrdinalIgnoreCase)
            || value.Equals(UserRegistrationConstants.ProfessionTypeOther, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAllowedRegulatoryBody(string value)
    {
        return value.Equals(UserRegistrationConstants.RegulatoryBodyHpcsa, StringComparison.OrdinalIgnoreCase)
            || value.Equals(UserRegistrationConstants.RegulatoryBodySanc, StringComparison.OrdinalIgnoreCase)
            || value.Equals(UserRegistrationConstants.RegulatoryBodyOther, StringComparison.OrdinalIgnoreCase);
    }
}
