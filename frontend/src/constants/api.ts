/** The ABP tenant header key expected by the backend. */
export const TENANT_HEADER = "Abp-TenantId";

/** Default tenant used while MedStream runs single-tenant auth flows. */
export const DEFAULT_TENANT_ID = "1";

/** ABP token authentication endpoint. */
export const TOKEN_AUTH_ENDPOINT = "/api/TokenAuth/Authenticate";

/** ABP account registration endpoint. */
export const REGISTER_ENDPOINT = "/api/services/app/Account/Register";

/** ABP users pagination endpoint (admin). */
export const USERS_GET_ALL_ENDPOINT = "/api/services/app/User/GetAll";

/** ABP clinician approval endpoint (admin). */
export const USERS_APPROVE_CLINICIAN_ENDPOINT = "/api/services/app/User/ApproveClinician";
