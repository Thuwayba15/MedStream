using Abp.Authorization.Users;
using Abp.Extensions;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MedStream.Authorization.Users;

public class User : AbpUser<User>
{
    public const string DefaultPassword = "123qwe";

    [StringLength(32)]
    public string RequestedRegistrationRole { get; set; }

    public bool IsClinicianApprovalPending { get; set; }

    public DateTime? ClinicianApprovedAt { get; set; }

    public long? ClinicianApprovedByUserId { get; set; }

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

    [StringLength(32)]
    public string ApprovalStatus { get; set; }

    [StringLength(32)]
    public string IdNumber { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public DateTime? ClinicianSubmittedAt { get; set; }

    public static string CreateRandomPassword()
    {
        return Guid.NewGuid().ToString("N").Truncate(16);
    }

    public static User CreateTenantAdminUser(int tenantId, string emailAddress)
    {
        var user = new User
        {
            TenantId = tenantId,
            UserName = AdminUserName,
            Name = AdminUserName,
            Surname = AdminUserName,
            EmailAddress = emailAddress,
            Roles = new List<UserRole>()
        };

        user.SetNormalizedNames();

        return user;
    }
}
