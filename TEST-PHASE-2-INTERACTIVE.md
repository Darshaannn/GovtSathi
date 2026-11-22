# TEST PHASE 2: Interactive Mascot Live Verification Report

**Execution Date**: 2026-11-22  
**Target Portals**:
1. Parivahan Sarathi (`https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do`)
2. Passport Seva (`https://www.passportindia.gov.in/psp`)

---

## 1. Live Portal Verification Summary

| Portal | Matched Page | Mascot Expression | Quick-Reply Chips | Disclaimer Badge | Target Ring / Spotlight |
|---|---|:---:|:---:|:---:|:---:|
| **Parivahan Sarathi** | `screen_01_state_selection` | `pointing` | 5 active chips | **Visible** | Verified on `#stfNameId` |
| **Passport Seva** | `screen_01_advisory_popup` | `pointing` | 5 active chips | **Visible** | Verified on `.btn-close` |

---

## 2. Interactive Feature Assertions

1. **Expression States**:
   - Mascot loaded in alert `pointing` expression directed at the target element.
   - Mascot container properly scoped to Shadow DOM with single root instance (`#govguide-root-host`).
2. **Quick-Reply Chips Bar**:
   - 5 chips rendered: *"What is this page?"*, *"Documents?"*, *"I'm stuck"*, *"What's next?"*, and *"Say again"*.
   - Localized properly and wired to per-page data definitions.
3. **Disclaimer Badge**:
   - *"Not a government product / Independent helper"* badge rendered persistently on both portals.
4. **Safety & Privacy Compliance**:
   - Browsing strictly read-only.
   - Zero form typing.
   - Zero credentials or Aadhaar requests.
   - Zero external runtime network requests.
