using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using MedStream.Authorization.Users;
using System;

namespace MedStream.Sessions.Dto;

[AutoMapFrom(typeof(User))]
public class UserLoginInfoDto : EntityDto<long>
{
    public string Name { get; set; }

    public string Surname { get; set; }

    public string UserName { get; set; }

    public string EmailAddress { get; set; }

    public string[] RoleNames { get; set; }

    public string RequestedRegistrationRole { get; set; }

    public bool IsClinicianApprovalPending { get; set; }

    public DateTime? ClinicianApprovedAt { get; set; }
}
