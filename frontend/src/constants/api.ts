export const API = {
    /** The ABP tenant header key expected by the backend. */
    TENANT_HEADER: "Abp-TenantId",

    /** Default tenant used while MedStream runs single-tenant auth flows. */
    DEFAULT_TENANT_ID: "1",

    /** ABP token authentication endpoint. */
    TOKEN_AUTH_ENDPOINT: "/api/TokenAuth/Authenticate",

    /** ABP account registration endpoint. */
    REGISTER_ENDPOINT: "/api/services/app/Account/Register",

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

    /** ABP patient intake check-in endpoint. */
    PATIENT_INTAKE_CHECKIN_ENDPOINT: "/api/services/app/PatientIntake/CheckIn",

    /** ABP patient intake symptom capture endpoint. */
    PATIENT_INTAKE_CAPTURE_SYMPTOMS_ENDPOINT: "/api/services/app/PatientIntake/CaptureSymptoms",

    /** ABP patient intake primary symptom extraction endpoint. */
    PATIENT_INTAKE_EXTRACT_SYMPTOMS_ENDPOINT: "/api/services/app/PatientIntake/ExtractSymptoms",

    /** ABP patient intake dynamic question retrieval endpoint. */
    PATIENT_INTAKE_GET_QUESTIONS_ENDPOINT: "/api/services/app/PatientIntake/LoadQuestions",

    /** ABP patient intake early urgent-check endpoint. */
    PATIENT_INTAKE_URGENT_CHECK_ENDPOINT: "/api/services/app/PatientIntake/UrgentCheck",

    /** ABP patient intake triage assessment endpoint. */
    PATIENT_INTAKE_ASSESS_TRIAGE_ENDPOINT: "/api/services/app/PatientIntake/AssessTriage",

    /** ABP patient intake current queue-status endpoint. */
    PATIENT_INTAKE_CURRENT_QUEUE_STATUS_ENDPOINT: "/api/services/app/PatientIntake/GetCurrentQueueStatus",

    /** ABP clinician queue dashboard listing endpoint. */
    QUEUE_OPERATIONS_GET_CLINICIAN_QUEUE_ENDPOINT: "/api/services/app/QueueOperations/GetClinicianQueue",

    /** ABP clinician queue review-details endpoint. */
    QUEUE_OPERATIONS_GET_QUEUE_REVIEW_ENDPOINT: "/api/services/app/QueueOperations/GetQueueTicketForReview",

    /** ABP clinician queue status-update endpoint. */
    QUEUE_OPERATIONS_UPDATE_QUEUE_STATUS_ENDPOINT: "/api/services/app/QueueOperations/UpdateQueueTicketStatus",

    /** ABP clinician queue urgency-override endpoint. */
    QUEUE_OPERATIONS_OVERRIDE_QUEUE_URGENCY_ENDPOINT: "/api/services/app/QueueOperations/OverrideQueueTicketUrgency",

    /** Internal Next route for auth login. */
    AUTH_LOGIN_ROUTE: "/api/auth/login",

    /** Internal Next route for auth registration. */
    AUTH_REGISTER_ROUTE: "/api/auth/register",

    /** Internal Next route for auth logout. */
    AUTH_LOGOUT_ROUTE: "/api/auth/logout",

    /** Internal Next route for current auth state. */
    AUTH_ME_ROUTE: "/api/auth/me",

    /** Internal Next route to resolve a SignalR access token for the current session. */
    AUTH_SIGNALR_TOKEN_ROUTE: "/api/auth/signalr-token",

    /** Internal Next admin route for clinician applicant listing. */
    ADMIN_USERS_ROUTE: "/api/auth/admin/users",

    /** Internal Next admin route for clinician approval. */
    ADMIN_APPROVE_ROUTE: "/api/auth/admin/approve",

    /** Internal Next admin route for clinician decline. */
    ADMIN_DECLINE_ROUTE: "/api/auth/admin/decline",

    /** Internal Next admin route for facilities list/create/update. */
    ADMIN_FACILITIES_ROUTE: "/api/auth/admin/facilities",

    /** Internal Next admin route for facility activation/deactivation. */
    ADMIN_FACILITIES_ACTIVATION_ROUTE: "/api/auth/admin/facilities/activation",

    /** Internal Next admin route for clinician-facility assignment. */
    ADMIN_FACILITIES_ASSIGN_ROUTE: "/api/auth/admin/facilities/assign",

    /** Internal Next route for active facilities used in registration forms. */
    ACTIVE_FACILITIES_ROUTE: "/api/auth/facilities/active",

    /** Internal Next route to initialize a patient check-in session. */
    PATIENT_INTAKE_CHECKIN_ROUTE: "/api/patient-intake/check-in",

    /** Internal Next route to capture patient symptom input payload. */
    PATIENT_INTAKE_SYMPTOMS_ROUTE: "/api/patient-intake/symptoms",

    /** Internal Next route to extract primary symptoms from free text/chips. */
    PATIENT_INTAKE_EXTRACT_ROUTE: "/api/patient-intake/extract",

    /** Internal Next route to fetch dynamic follow-up intake questions. */
    PATIENT_INTAKE_QUESTIONS_ROUTE: "/api/patient-intake/questions",

    /** Internal Next route to run early urgent-check in intake flow. */
    PATIENT_INTAKE_URGENT_CHECK_ROUTE: "/api/patient-intake/urgent-check",

    /** Internal Next route to assess triage and queue placeholder status. */
    PATIENT_INTAKE_TRIAGE_ROUTE: "/api/patient-intake/triage",

    /** Internal Next route to read the current patient's queue status for a visit. */
    PATIENT_INTAKE_QUEUE_STATUS_ROUTE: "/api/patient-intake/queue-status",

    /** Internal Next route for clinician queue dashboard data. */
    CLINICIAN_QUEUE_ROUTE: "/api/clinician/queue",

    /** Internal Next route prefix for clinician queue ticket details/status. */
    CLINICIAN_QUEUE_TICKET_ROUTE_PREFIX: "/api/clinician/queue",

    /** Backend SignalR hub path for queue realtime updates. */
    QUEUE_SIGNALR_HUB_PATH: "/signalr/queue",
} as const;
