# Writing a New Portal Guide

GovGuide uses pure JSON files to define guides for government portals. Anyone can author or improve a guide without writing JavaScript.

---

## 1. Guide Anatomy

Guides live under `guides/<portal_id>/<flow_id>.json`. Every guide contains:

1. **Metadata**: Unique `id`, descriptive `name`, `verifiedFor` note, and `urlPatterns`.
2. **Languages**: `supportedLanguages` list and `defaultLanguage`.
3. **Flows**: Array of user journeys. Each flow contains:
   - `flowId`: Identifier (e.g. `apply_ll`).
   - `name`: Localized name dictionary.
   - `documents`: Optional list of mandatory documents for the checklist.
   - `whatsNext`: Optional preview of upcoming milestones with trust levels.
   - `pages`: Array of screens matching portal states.

---

## 2. Page Matching Heuristics

A page is detected using 3 criteria:
```json
"match": {
  "urlRegex": "sarathi\\.parivahan\\.gov\\.in/sarathiservice/(stateSelection\\.do)?(\\?.*)?$",
  "pageTitle": "Home",
  "elementPresence": "select#stfNameId, select[name='stName']"
}
```

- `urlRegex`: Tested against current `window.location.href`.
- `pageTitle`: Optional substring check against `document.title`.
- `elementPresence`: Optional CSS selector of an element that must be visible.

---

## 3. Step Structure

Each page contains an array of `steps`:
```json
{
  "stepId": "step_01_select_state",
  "order": 1,
  "actionType": "point_and_click",
  "target": {
    "id": "stfNameId",
    "css": "select#stfNameId, select[name='stName']",
    "textMatch": "Select State Name",
    "relativeTo": null
  },
  "messages": {
    "en": {
      "speech": "Please select your State from this dropdown menu to view services.",
      "bubble": "Select your state from this dropdown.",
      "spoken": "Okay, so to get started, please select your state from this dropdown menu."
    },
    "hi": {
      "speech": "सेवाएं देखने के लिए कृपया इस ड्रॉपडाउन मेनू से अपना राज्य चुनें।",
      "bubble": "इस ड्रॉपडाउन से अपना राज्य चुनें।"
    }
  },
  "stepDoneTrigger": {
    "type": "change"
  }
}
```

---

## 4. Contextual Fields for Quick-Reply Chips

Add these optional fields to each page object to power companion chips:
- **`about`**: Explains what this page is for (*"What is this page?"* chip).
- **`documents`**: Array of document objects for the checklist (*"Documents?"* chip).
- **`stuck`**: Practical advice when a user gets blocked (*"I'm stuck"* chip).
- **`next`**: What will happen on the next screen (*"What's next?"* chip).

---

## 5. "What's Next" Layer & Trust Levels Specification

To guide citizens beyond reachable public screens without fabricating facts, GovGuide supports an optional `whatsNext` array at both the flow and page level.

### Trust Levels:
1. **`verified_page`**: The screen has been directly verified and captured by the development team.
2. **`official_document`**: The step is documented in official government user manuals, circulars, or instruction pages (`gov.in` / `nic.in`). Requires a `source` object.
3. **`unverified`**: Process details that vary or lack a definitive central statutory source. Displays the badge *"Not verified. The portal may be different."*

> **Hard Rule: No Official Source Means Unverified**  
> If an upcoming stage or procedural nuance has no official government document, manual, or circular to reference, it must **never** be presented as fact. It must be tagged as `trust: "unverified"`.

### `whatsNext` Item Schema:
```json
{
  "id": "stage_01_ekyc_choice",
  "order": 1,
  "title": {
    "en": "Aadhaar eKYC vs Non-Aadhaar Verification",
    "hi": "आधार ई-केवाईसी बनाम गैर-आधार सत्यापन"
  },
  "explanation": {
    "en": {
      "bubble": "Choose between Aadhaar contactless verification (take test from home) or physical RTO visit. Keep your Aadhaar-linked mobile ready for OTP. Never share your OTP with anyone.",
      "spoken": "First, you will choose how to authenticate. If you use your Aadhaar number, you can take the learner test from home without visiting an RTO office. Please keep your Aadhaar-linked phone ready for the verification OTP, and remember never to share your OTP with anyone."
    },
    "hi": {
      "bubble": "आधार संपर्क रहित सत्यापन (घर से परीक्षा) या आरटीओ जाने का विकल्प चुनें।"
    }
  },
  "trust": "official_document",
  "source": {
    "title": "Sarathi Parivahan Online LL Application Guidelines",
    "url": "https://sarathi.parivahan.gov.in/",
    "retrievedOn": "2026-11-22"
  },
  "explainOnly": true
}
```

### Safety and Stale Checks:
- If `retrievedOn` is older than 180 days, GovGuide automatically displays a cautionary note: *"This may have changed. Check the portal."*
- `whatsNext` items **never** create a spotlight, target pulse ring, or step-done trigger.

---

## 6. Security & Privacy Rules for Contributors

1. **NEVER target passwords, OTPs, or Aadhaar fields for interaction.** Account creation, OTP entry, and payment stages must use `actionType: "explain_only"` or be structured in `whatsNext`.
2. **NEVER submit captures containing personal data.** All screenshots or test runs must use mock/sample data or be purely informational public pages.
