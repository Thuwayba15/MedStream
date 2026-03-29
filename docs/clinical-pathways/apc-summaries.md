# APC 2023 Fallback Summaries

These summaries are for **AI fallback intake generation only**.

Use them when:
- no strong approved JSON pathway exists, or
- classification confidence is low/ambiguous.

Do **not** use them to replace deterministic triage or clinician review.

## Excluded because already JSON-driven
- `general_adult_fever_cough`
- `cough_or_difficulty_breathing`
- `hand_or_upper_limb_injury`
- `general_unspecified_complaint`

## Included summaries
### Chest Pain
- `id`: `chest_pain`
- pages: 37, 137
- category: `cardiorespiratory`
- complaint cues: chest pain, tight chest, pressure in chest, pain in chest, heavy chest
- urgent subjective red flags: Is the pain severe right now?, Did the pain start at rest or with very little effort?, Do you also have shortness of breath?, Does the pain spread to your arm, jaw, neck, or back?, Are you sweaty, pale, faint, or nauseous with the pain?
- likely links: initial_assessment_of_the_patient, ischaemic_heart_disease_initial_assessment, cough_or_difficulty_breathing

### Abdominal Pain / Heartburn
- `id`: `abdominal_pain_heartburn`
- pages: 44
- category: `gastrointestinal`
- complaint cues: abdominal pain, stomach pain, tummy pain, belly pain, heartburn
- urgent subjective red flags: Is the pain severe or getting rapidly worse?, Are you pregnant or could you be pregnant?, Have you had vomiting that will not stop?, Have you had no stool or wind for the past day?, Are your eyes or skin yellow?, Have you fainted or felt very weak with the pain?
- likely links: urinary_symptoms, pregnancy, vaginal_bleeding

### Injured Patient
- `id`: `injured_patient`
- pages: 18
- category: `injury`
- complaint cues: injury, fall, hurt myself, wound, fracture, cut, trauma
- urgent subjective red flags: Is there heavy bleeding right now?, Did you lose consciousness?, Is the injury to the head, neck, chest, or abdomen?, Can you move the injured limb normally?, Is there severe deformity, exposed bone, or numbness/coldness below the injury?
- likely links: emergency_patient, arm_hand_symptoms, leg_symptoms

### Headache
- `id`: `headache`
- pages: 30
- category: `neurological`
- complaint cues: headache, head pain, migraine, bad headache
- urgent subjective red flags: Did the headache start suddenly and severely?, Do you also have vomiting, confusion, weakness, or fits?, Do you have fever with the headache?, Have you recently had head injury?, Are you pregnant with severe headache?
- likely links: decreased_consciousness, initial_assessment_of_the_patient, vaginal_bleeding

### Fever
- `id`: `fever`
- pages: 24
- category: `general_systemic`
- complaint cues: fever, feverish, hot, temperature, chills
- urgent subjective red flags: Are you confused, very weak, or struggling to breathe?, Do you have severe headache, rash, or vomiting blood?, Have you recently travelled to a malaria area?, Do you have cough, night sweats, or weight loss?, Are you pregnant?
- likely links: screen_all_patients_for_covid_19_and_tb, tb_diagnosis, acute_covid_19

### Collapse / Blackout / Faint
- `id`: `collapse_blackout_faint`
- pages: 28
- category: `neurological`
- complaint cues: collapse, blackout, fainted, passed out, fell down suddenly
- urgent subjective red flags: Did you completely lose consciousness?, Do you have chest pain, palpitations, or shortness of breath?, Did you have a seizure or shaking movements?, Did you hit your head or injure yourself?, Are you confused or weak afterwards?
- likely links: decreased_consciousness, assess_and_manage_glucose, chest_pain

### Dizziness
- `id`: `dizziness`
- pages: 29
- category: `neurological`
- complaint cues: dizzy, dizziness, lightheaded, vertigo, room spinning
- urgent subjective red flags: Did you faint or almost faint?, Do you have chest pain, palpitations, or shortness of breath?, Do you have weakness, numbness, speech trouble, or severe headache?, Do you have vomiting and cannot keep fluids down?
- likely links: collapse_blackout_faint, ear_symptoms, headache

### Nausea / Vomiting
- `id`: `nausea_vomiting`
- pages: 45
- category: `gastrointestinal`
- complaint cues: nausea, vomiting, vomit, throwing up, can't keep food down
- urgent subjective red flags: Are you unable to keep down any fluids?, Are you vomiting blood?, Do you also have severe abdominal pain, headache, or confusion?, Are you pregnant or could you be pregnant?, Have you had diarrhoea, jaundice, or no stool/wind?
- likely links: abdominal_pain_heartburn, diarrhoea, pregnancy

### Urinary Symptoms
- `id`: `urinary_symptoms`
- pages: 59
- category: `genitourinary`
- complaint cues: burning urine, pain when urinating, urinary frequency, can't pass urine, blood in urine
- urgent subjective red flags: Are you unable to pass urine?, Do you have fever, vomiting, or flank/back pain?, Are you pregnant?, Is there visible blood in the urine?
- likely links: abdominal_pain_heartburn, genital_symptoms, pregnancy
