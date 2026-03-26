namespace MedStream.Authorization;

public static class PermissionNames
{
    public const string Pages_Tenants = "Pages.Tenants";

    public const string Pages_Users = "Pages.Users";
    public const string Pages_Users_View = "Pages.Users.View";
    public const string Pages_Users_Activation = "Pages.Users.Activation";
    public const string Pages_Users_Approvals = "Pages.Users.Approvals";
    public const string Pages_Users_Approvals_View = "Pages.Users.Approvals.View";
    public const string Pages_Users_Approvals_Approve = "Pages.Users.Approvals.Approve";
    /// <summary>
    /// Allows tenant administrators to decline clinician approval requests.
    /// </summary>
    public const string Pages_Users_Approvals_Decline = "Pages.Users.Approvals.Decline";

    /// <summary>
    /// Root permission for facility governance capabilities.
    /// </summary>
    public const string Pages_Facilities = "Pages.Facilities";
    /// <summary>
    /// Allows listing and viewing facility records.
    /// </summary>
    public const string Pages_Facilities_View = "Pages.Facilities.View";
    /// <summary>
    /// Allows creating new facility records.
    /// </summary>
    public const string Pages_Facilities_Create = "Pages.Facilities.Create";
    /// <summary>
    /// Allows editing existing facility records.
    /// </summary>
    public const string Pages_Facilities_Edit = "Pages.Facilities.Edit";
    /// <summary>
    /// Allows activating or deactivating facilities.
    /// </summary>
    public const string Pages_Facilities_Activation = "Pages.Facilities.Activation";
    /// <summary>
    /// Allows assigning and reassigning clinicians to facilities.
    /// </summary>
    public const string Pages_Facilities_AssignClinician = "Pages.Facilities.AssignClinician";

    public const string Pages_Roles = "Pages.Roles";
}
