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
        userApprovals.CreateChildPermission(PermissionNames.Pages_Users_Approvals_Decline, L("UsersApprovalsDecline"));

        var facilities = context.CreatePermission(PermissionNames.Pages_Facilities, L("Facilities"));
        facilities.CreateChildPermission(PermissionNames.Pages_Facilities_View, L("FacilitiesView"));
        facilities.CreateChildPermission(PermissionNames.Pages_Facilities_Create, L("FacilitiesCreate"));
        facilities.CreateChildPermission(PermissionNames.Pages_Facilities_Edit, L("FacilitiesEdit"));
        facilities.CreateChildPermission(PermissionNames.Pages_Facilities_Activation, L("FacilitiesActivation"));
        facilities.CreateChildPermission(PermissionNames.Pages_Facilities_AssignClinician, L("FacilitiesAssignClinician"));

        context.CreatePermission(PermissionNames.Pages_Roles, L("Roles"));
        context.CreatePermission(PermissionNames.Pages_Tenants, L("Tenants"), multiTenancySides: MultiTenancySides.Host);
    }

    private static ILocalizableString L(string name)
    {
        return new LocalizableString(name, MedStreamConsts.LocalizationSourceName);
    }
}
