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

Add these optional fields to each page object to power the companion chips:
- **`about`**: Explains what this page is for (*"What is this page?"* chip).
- **`documents`**: Array of document objects for the checklist (*"Documents?"* chip).
- **`stuck`**: Practical advice when a user gets blocked (*"I'm stuck"* chip).
- **`next`**: What will happen on the next screen (*"What's next?"* chip).

---

## 5. Security & Privacy Rules for Contributors

1. **NEVER target passwords, OTPs, or Aadhaar fields for interaction.** Account creation, OTP entry, and payment stages must use `actionType: "explain_only"`.
2. **NEVER submit captures containing personal data.** All screenshots or test runs must use mock/sample data or be purely informational public pages.
