export const API = {
    /** The ABP tenant header key expected by the backend. */
    TENANT_HEADER: "Abp-TenantId",

    /** Default tenant used while MedStream runs single-tenant auth flows. */
    DEFAULT_TENANT_ID: "1",

    /** ABP token authentication endpoint. */
    TOKEN_AUTH_ENDPOINT: "/api/TokenAuth/Authenticate",

    /** ABP account registration endpoint. */
    REGISTER_ENDPOINT: "/api/services/app/Account/Register",

    /** ABP users pagination endpoint (admin). */
    USERS_GET_ALL_ENDPOINT: "/api/services/app/User/GetAll",

    /** ABP clinician applicant listing endpoint (admin). */
    USERS_GET_CLINICIAN_APPLICANTS_ENDPOINT: "/api/services/app/User/GetClinicianApplicants",

    /** ABP clinician approval endpoint (admin). */
    USERS_APPROVE_CLINICIAN_ENDPOINT: "/api/services/app/User/ApproveClinician",

    /** ABP clinician decline endpoint (admin). */
    USERS_DECLINE_CLINICIAN_ENDPOINT: "/api/services/app/User/DeclineClinician",

    /** ABP facility pagination endpoint (admin). */
    FACILITIES_GET_ALL_ENDPOINT: "/api/services/app/Facility/GetAll",

    /** ABP facility create endpoint (admin). */
    FACILITIES_CREATE_ENDPOINT: "/api/services/app/Facility/Create",

    /** ABP facility update endpoint (admin). */
    FACILITIES_UPDATE_ENDPOINT: "/api/services/app/Facility/Update",

    /** ABP facility activation endpoint (admin). */
    FACILITIES_SET_ACTIVATION_ENDPOINT: "/api/services/app/Facility/SetActivation",

    /** ABP facility-clinician assignment endpoint (admin). */
    FACILITIES_ASSIGN_CLINICIAN_ENDPOINT: "/api/services/app/Facility/AssignClinician",

    /** ABP active facilities endpoint for registration dropdowns. */
    ACCOUNT_ACTIVE_FACILITIES_ENDPOINT: "/api/services/app/Account/GetActiveFacilities",
} as const;
