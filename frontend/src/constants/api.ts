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
} as const;
