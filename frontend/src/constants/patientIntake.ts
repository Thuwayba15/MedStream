export const PATIENT_INTAKE_STEPS = [
    { key: "check-in", label: "Check-In", subtitle: "Step 1 of 5" },
    { key: "urgent-check", label: "Urgent Check", subtitle: "Step 2 of 5" },
    { key: "symptoms", label: "Describe Symptoms", subtitle: "Step 3 of 5" },
    { key: "questions", label: "Follow-Up Questions", subtitle: "Step 4 of 5" },
    { key: "status", label: "Status & Queue", subtitle: "Step 5 of 5" },
] as const;

export const COMMON_SYMPTOMS = [
    "Headache",
    "Cough",
    "Fever",
    "Chest Pain",
    "Stomach Pain",
    "Dizziness",
    "Sore Throat",
    "Body Aches",
    "Difficulty Breathing",
    "Skin Rash",
    "Nausea",
    "Fatigue",
] as const;
