using Abp.Authorization.Users;
using Abp.Authorization;
using Abp.Configuration;
using Abp.Domain.Entities;
using Abp.Domain.Repositories;
using Abp.Extensions;
using Abp.IdentityFramework;
using Abp.Runtime.Validation;
using Abp.UI;
using Abp.Zero.Configuration;
using MedStream.Authorization.Accounts.Dto;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;
using MedStream.Facilities;
using Microsoft.EntityFrameworkCore;
using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MedStream.Authorization.Accounts;

public class AccountAppService : MedStreamAppServiceBase, IAccountAppService
{
    public const string PasswordRegex = "(?=^.{8,}$)(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\\s)[0-9a-zA-Z!@#$%^&*()]*$";
    private const int DefaultTenantId = 1;

    private readonly UserRegistrationManager _userRegistrationManager;
    private readonly UserManager _userManager;
    private readonly RoleManager _roleManager;
    private readonly IRepository<Role, int> _roleRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly IRepository<Facility, int> _facilityRepository;

    public AccountAppService(
        UserRegistrationManager userRegistrationManager,
        UserManager userManager,
        RoleManager roleManager,
        IRepository<Role, int> roleRepository,
        IRepository<User, long> userRepository,
        IRepository<Facility, int> facilityRepository)
    {
        _userRegistrationManager = userRegistrationManager;
        _userManager = userManager;
        _roleManager = roleManager;
        _roleRepository = roleRepository;
        _userRepository = userRepository;
        _facilityRepository = facilityRepository;
    }

    public async Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input)
    {
        var tenant = await TenantManager.FindByTenancyNameAsync(input.TenancyName);
        if (tenant == null)
        {
            return new IsTenantAvailableOutput(TenantAvailabilityState.NotFound);
        }

        if (!tenant.IsActive)
        {
            return new IsTenantAvailableOutput(TenantAvailabilityState.InActive);
        }

        return new IsTenantAvailableOutput(TenantAvailabilityState.Available, tenant.Id);
    }

    public async Task<RegisterOutput> Register(RegisterInput input)
    {
        try
        {
            ValidateRegistrationInput(input);

            var normalizedAccountType = NormalizeAccountType(input.AccountType);
            var isClinicianApplicant = string.Equals(
                normalizedAccountType,
                UserRegistrationConstants.AccountTypeClinician,
                StringComparison.Ordinal);
            var normalizedEmailAddress = input.EmailAddress.Trim();
            var selectedFacility = await ResolveRequestedFacilityAsync(input, isClinicianApplicant);

            var createdUser = await _userRegistrationManager.RegisterAsync(
                input.FirstName.Trim(),
                input.LastName.Trim(),
                normalizedEmailAddress,
                normalizedEmailAddress,
                input.Password,
                true,
                DefaultTenantId);

            var user = createdUser;

            user.PhoneNumber = input.PhoneNumber.Trim();
            user.AccountType = normalizedAccountType;
            user.IdNumber = input.IdNumber?.Trim();
            user.DateOfBirth = input.DateOfBirth;
            user.RequestedRegistrationRole = normalizedAccountType;
            user.IsClinicianApprovalPending = isClinicianApplicant;
            user.ProfessionType = isClinicianApplicant ? NormalizeProfessionType(input.ProfessionType) : null;
            user.RegulatoryBody = isClinicianApplicant ? NormalizeRegulatoryBody(input.RegulatoryBody) : null;
            user.RegistrationNumber = isClinicianApplicant ? input.RegistrationNumber?.Trim() : null;
            user.RequestedFacility = isClinicianApplicant ? selectedFacility?.Name : null;
            user.ClinicianFacilityId = isClinicianApplicant ? selectedFacility?.Id : null;
            user.ClinicianSubmittedAt = isClinicianApplicant ? DateTime.UtcNow : null;
            user.ClinicianApprovedAt = isClinicianApplicant ? null : DateTime.UtcNow;
            user.ClinicianApprovedByUserId = null;
            user.ApprovalStatus = isClinicianApplicant
                ? UserRegistrationConstants.ApprovalStatusPending
                : UserRegistrationConstants.ApprovalStatusApproved;

            if (!user.IsClinicianApprovalPending)
            {
                var patientRole = await GetOrCreateTenantRoleAsync(DefaultTenantId, StaticRoleNames.Tenants.Patient);
                if (!user.Roles.Any(role => role.RoleId == patientRole.Id))
                {
                    user.Roles.Add(new UserRole(DefaultTenantId, user.Id, patientRole.Id));
                }
            }

            await _userRepository.UpdateAsync(user);
            await CurrentUnitOfWork.SaveChangesAsync();

            var isEmailConfirmationRequiredForLogin = await SettingManager.GetSettingValueAsync<bool>(
                AbpZeroSettingNames.UserManagement.IsEmailConfirmationRequiredForLogin);

            return new RegisterOutput
            {
                CanLogin = user.IsActive && (user.IsEmailConfirmed || !isEmailConfirmationRequiredForLogin),
                RegistrationRole = normalizedAccountType,
                IsClinicianApprovalPending = user.IsClinicianApprovalPending,
                AuthState = user.IsClinicianApprovalPending ? "clinician_pending_approval" : "patient"
            };
        }
        catch (EntityNotFoundException exception) when (exception.EntityType == typeof(User))
        {
            throw new UserFriendlyException("Registration failed due to inconsistent user state. Please retry.");
        }
    }

    /// <summary>
    /// Returns active facilities available for registration dropdowns.
    /// </summary>
    [AbpAllowAnonymous]
    public async Task<List<RegistrationFacilityDto>> GetActiveFacilities()
    {
        var facilities = await _facilityRepository.GetAll()
            .Where(item => item.TenantId == DefaultTenantId && item.IsActive)
            .OrderBy(item => item.Name)
            .Select(item => new RegistrationFacilityDto
            {
                Id = item.Id,
                Name = item.Name
            })
            .ToListAsync();

        return facilities;
    }

    private static string NormalizeAccountType(string accountType)
    {
        return accountType.Trim().Equals(UserRegistrationConstants.AccountTypeClinician, StringComparison.OrdinalIgnoreCase)
            ? UserRegistrationConstants.AccountTypeClinician
            : UserRegistrationConstants.AccountTypePatient;
    }

    private static string NormalizeProfessionType(string professionType)
    {
        if (professionType.IsNullOrWhiteSpace())
        {
            return null;
        }

        if (professionType.Equals(UserRegistrationConstants.ProfessionTypeDoctor, StringComparison.OrdinalIgnoreCase))
        {
            return UserRegistrationConstants.ProfessionTypeDoctor;
        }

        if (professionType.Equals(UserRegistrationConstants.ProfessionTypeNurse, StringComparison.OrdinalIgnoreCase))
        {
            return UserRegistrationConstants.ProfessionTypeNurse;
        }

        if (professionType.Equals(UserRegistrationConstants.ProfessionTypeAlliedHealth, StringComparison.OrdinalIgnoreCase))
        {
            return UserRegistrationConstants.ProfessionTypeAlliedHealth;
        }

        return UserRegistrationConstants.ProfessionTypeOther;
    }

    private static string NormalizeRegulatoryBody(string regulatoryBody)
    {
        if (regulatoryBody.IsNullOrWhiteSpace())
        {
            return null;
        }

        if (regulatoryBody.Equals(UserRegistrationConstants.RegulatoryBodyHpcsa, StringComparison.OrdinalIgnoreCase))
        {
            return UserRegistrationConstants.RegulatoryBodyHpcsa;
        }

        if (regulatoryBody.Equals(UserRegistrationConstants.RegulatoryBodySanc, StringComparison.OrdinalIgnoreCase))
        {
            return UserRegistrationConstants.RegulatoryBodySanc;
        }

        return UserRegistrationConstants.RegulatoryBodyOther;
    }

    private void ValidateRegistrationInput(RegisterInput input)
    {
        var validator = new RegisterInputFluentValidator();
        var validationResult = validator.Validate(input);
        if (validationResult.IsValid)
        {
            if (string.Equals(input.AccountType, UserRegistrationConstants.AccountTypeClinician, StringComparison.OrdinalIgnoreCase))
            {
                if (!input.RequestedFacilityId.HasValue || input.RequestedFacilityId.Value <= 0)
                {
                    throw new AbpValidationException(
                        "Registration validation failed.",
                        new List<ValidationResult>
                        {
                            new("Requested facility must be selected from the active facility list.", new[] { nameof(input.RequestedFacilityId) })
                        });
                }
            }

            return;
        }

        var validationErrors = validationResult.Errors
            .Select(error => new ValidationResult(error.ErrorMessage, new[] { error.PropertyName }))
            .ToList();
        throw new AbpValidationException("Registration validation failed.", validationErrors);
    }

    private async Task<Role> GetOrCreateTenantRoleAsync(int tenantId, string roleName)
    {
        var normalizedRoleName = roleName.ToUpperInvariant();
        var existingRole = await _roleRepository.FirstOrDefaultAsync(role =>
            role.TenantId == tenantId && role.NormalizedName == normalizedRoleName);
        if (existingRole != null)
        {
            return existingRole;
        }

        var role = new Role(tenantId, roleName, roleName)
        {
            IsStatic = true,
            IsDefault = false
        };
        role.NormalizedName = normalizedRoleName;

        (await _roleManager.CreateAsync(role)).CheckErrors(LocalizationManager);
        return role;
    }

    private async Task<Facility> ResolveRequestedFacilityAsync(RegisterInput input, bool isClinicianApplicant)
    {
        if (!isClinicianApplicant)
        {
            return null;
        }

        if (!input.RequestedFacilityId.HasValue || input.RequestedFacilityId.Value <= 0)
        {
            throw new UserFriendlyException("Requested facility must be selected from the active facility list.");
        }

        var facility = await _facilityRepository.FirstOrDefaultAsync(item =>
            item.Id == input.RequestedFacilityId.Value &&
            item.TenantId == DefaultTenantId &&
            item.IsActive);
        if (facility == null)
        {
            throw new UserFriendlyException("Requested facility must be selected from the active facility list.");
        }

        return facility;
    }
}
