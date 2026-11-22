# Unsourced Items, Rejected Results, and Verification Audit

This document records the dev-time research audit, discarded URLs, and items in portal application lifecycles where no specific government documentation or official circular could be definitively referenced at development time. Under GovGuide's strict truthfulness rules, any item without a direct official government source must **never be stated as a verified fact** and must be classified as `unverified` with the trust label: *"Not verified. The portal may be different."*

---

## 1. Domain Whitelist Compliance
Per strict mission requirements, citations are restricted to official government domains:
- `parivahan.gov.in`
- `sarathi.parivahan.gov.in`
- `transport.delhi.gov.in`
- `services.india.gov.in`
- `passportindia.gov.in`
- `mea.gov.in`

Any third-party blogs, commercial services, news articles, or non-official aggregators encountered during research were rejected and excluded from guides.

---

## 2. Rejected / Dropped URLs (Failed Live HTTP Check)

During live URL verification, legacy paths formerly used on portal versions were tested against the live server. Those returning HTTP 404 or non-200 responses were immediately dropped:

| Portal | Dropped URL | Reason for Rejection | Action Taken |
|---|---|---|---|
| Passport Seva | `https://www.passportindia.gov.in/AppOnlineProject/online/procFormSubOnl` | Returned HTTP 404. Portal migrated to SPA architecture (`/psp`). | Replaced with verified live portal URLs (`https://www.passportindia.gov.in/psp` and `https://services1.passportindia.gov.in/forms/registration`). |
| Passport Seva | `https://www.passportindia.gov.in/AppOnlineProject/online/feeSchedule` | Returned HTTP 404 on direct request. | Replaced with official published PDF circular (`https://www.passportindia.gov.in/AppOnlineProject/pdf/Appointment_opening_time.pdf`) and omitted exact numerical fees. |
| Passport Seva | `https://www.passportindia.gov.in/AppOnlineProject/statusTracker/trackStatusInpNew` | Returned HTTP 404 on direct request. | Replaced with live canonical portal tracker endpoint (`https://www.passportindia.gov.in/psp`). |

---

## 3. Disallowed Cross-State Documents

Per source rules:
- State-department documents from other states (e.g., `transport.py.gov.in`, `vswsonline.ap.gov.in`) may only confirm general stage sequencing, must be tagged `"other state, may differ"`, and must **never** be used for Delhi-specific facts.
- **Audit Result**: No other-state statutory documents were used to establish Delhi facts. Delhi Learner's Licence requirements were verified against `sarathi.parivahan.gov.in` and `transport.delhi.gov.in`.

---

## 4. Omitted & Unverified Details Audit

### Sarathi Parivahan (Delhi Learner's Licence)
- **Specific Monetary Fees**: Portal fees can change by state notification (e.g. Rule 32 of Central Motor Vehicles Rules vs state testing fees). Omitted hardcoded total rupee amounts; guided user to review the system-generated fee breakdown on the official portal screen.
- **Exact Document Rejection Criteria**: While required document categories (Age Proof, Address Proof) are specified, individual RTO officer discretion on slight spelling discrepancies is not codified centrally. Stated only as advisory advice: *"Ensure names and dates match across all supporting documents before uploading."*
- **Online Facial Recognition STALL Hardware Specifications**: Minimum webcam resolution and bandwidth requirements are not published centrally. Stated as general webcam requirement.

### Passport Seva (Ministry of External Affairs)
- **Specific Tatkaal / Normal Fee Figures**: Stated only that payment is mandatory and depends on service type (Normal vs. Tatkaal) and booklet pages (36 vs. 60). No unverified numeric amounts stated.
- **Walk-in Revisit Timelines for Minor Deficiencies**: Discretionary across individual Regional Passport Offices (RPOs). Omitted from verified facts.
- **Local Police Station Processing Speed**: Varies widely by municipal jurisdiction. No timeframe is promised; citizens are directed strictly to the official live status tracker.
