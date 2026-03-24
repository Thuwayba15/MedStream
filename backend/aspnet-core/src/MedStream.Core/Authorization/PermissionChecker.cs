using Abp.Authorization;
using MedStream.Authorization.Roles;
using MedStream.Authorization.Users;

namespace MedStream.Authorization;

public class PermissionChecker : PermissionChecker<Role, User>
{
    public PermissionChecker(UserManager userManager)
        : base(userManager)
    {
    }
}
