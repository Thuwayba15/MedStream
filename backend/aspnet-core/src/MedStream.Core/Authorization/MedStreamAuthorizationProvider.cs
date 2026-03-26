using Abp.Authorization;
using Abp.Localization;
using Abp.MultiTenancy;

namespace MedStream.Authorization;

public class MedStreamAuthorizationProvider : AuthorizationProvider
{
    public override void SetPermissions(IPermissionDefinitionContext context)
    {
        var users = context.CreatePermission(PermissionNames.Pages_Users, L("Users"));
        users.CreateChildPermission(PermissionNames.Pages_Users_View, L("UsersView"));
        users.CreateChildPermission(PermissionNames.Pages_Users_Activation, L("UsersActivation"));

        var userApprovals = users.CreateChildPermission(PermissionNames.Pages_Users_Approvals, L("UsersApprovals"));
        userApprovals.CreateChildPermission(PermissionNames.Pages_Users_Approvals_View, L("UsersApprovalsView"));
        userApprovals.CreateChildPermission(PermissionNames.Pages_Users_Approvals_Approve, L("UsersApprovalsApprove"));

        context.CreatePermission(PermissionNames.Pages_Roles, L("Roles"));
        context.CreatePermission(PermissionNames.Pages_Tenants, L("Tenants"), multiTenancySides: MultiTenancySides.Host);
    }

    private static ILocalizableString L(string name)
    {
        return new LocalizableString(name, MedStreamConsts.LocalizationSourceName);
    }
}
