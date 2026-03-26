using Abp.Application.Services.Dto;
using Abp.Authorization.Users;
using Abp.AutoMapper;
using MedStream.Authorization.Users;
using System;
using System.ComponentModel.DataAnnotations;

namespace MedStream.Users.Dto;

[AutoMapFrom(typeof(User))]
public class UserDto : EntityDto<long>
{
    [Required]
    [StringLength(AbpUserBase.MaxUserNameLength)]
    public string UserName { get; set; }

    [Required]
    [StringLength(AbpUserBase.MaxNameLength)]
    public string Name { get; set; }

    [Required]
    [StringLength(AbpUserBase.MaxSurnameLength)]
    public string Surname { get; set; }

    [Required]
    [EmailAddress]
    [StringLength(AbpUserBase.MaxEmailAddressLength)]
    public string EmailAddress { get; set; }

    [StringLength(AbpUserBase.MaxPhoneNumberLength)]
    public string PhoneNumber { get; set; }

    public bool IsActive { get; set; }

    public string FullName { get; set; }

    public DateTime? LastLoginTime { get; set; }

    public DateTime CreationTime { get; set; }

    public string[] RoleNames { get; set; }

    public string RequestedRegistrationRole { get; set; }

    public bool IsClinicianApprovalPending { get; set; }

    public DateTime? ClinicianApprovedAt { get; set; }

    public long? ClinicianApprovedByUserId { get; set; }

    public DateTime? ClinicianDeclinedAt { get; set; }

    public long? ClinicianDeclinedByUserId { get; set; }

    public string AccountType { get; set; }

    public string ProfessionType { get; set; }

    public string RegulatoryBody { get; set; }

    public string RegistrationNumber { get; set; }

    public string RequestedFacility { get; set; }

    public int? ClinicianFacilityId { get; set; }

    public string ApprovalStatus { get; set; }

    public string ApprovalDecisionReason { get; set; }

    public string IdNumber { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public DateTime? ClinicianSubmittedAt { get; set; }
}
