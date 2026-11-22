# TEST PHASE 1: Interactive Mascot & Rich Guidance Verification

**Date**: 2026-11-22  
**Test Suite**: `tools/test-interactive-suite.js`  
**Status**: **ALL TESTS PASSED (100% Complete)**

---

## 1. Expression States Verification

| Expression State | Visual Poses / Variations | Trigger / Activation | Status |
|---|---|---|:---:|
| `idle` | Gentle sinusoidal floating (`govguide-idle`), resting wings, neutral gaze | Default resting state; when between steps | **PASS** |
| `pointing` | Dynamic forward tilt (`-3deg`), alert focused eye alignment, wing direction | When spotlight is active on a form element or button | **PASS** |
| `thinking` | Upward float with subtle sway (`govguide-thinking`), yellow lightbulb accessory | During Explain-This-Field mode, "I'm stuck" chip, or 20s inactivity | **PASS** |
| `happy` | Cheerful bounce celebration (`govguide-celebrate`), curved happy eyes, open smiling mouth | On step completion trigger / Next click (1.8s duration) | **PASS** |
| `confused` | Tilted crest & body (`+7deg`), orange question mark indicator | When target element cannot be found or fallback triggered | **PASS** |

---

## 2. Quick-Reply Chips Verification

Tested across all 15 pages in both Parivahan Sarathi (7 pages) and Passport Seva (8 pages):

| Chip Label | Data Source Field | Response Behavior | Speech / Audio | Status |
|---|---|---|---|:---:|
| **"What is this page?"** | `page.about` | Displays conversational explanation of the current portal view | Speaks localized message | **PASS** |
| **"What documents do I need?"** | `page.documents` / `flow.documents` | Displays required document list & opens expandable interactive checklist | Speaks summary | **PASS** |
| **"I'm stuck"** | `page.stuck` | Provides actionable troubleshooting & hints | Mascot switches to `thinking`, speaks advice | **PASS** |
| **"What's next?"** | `page.next` | Summarizes upcoming milestones and actions | Speaks roadmap overview | **PASS** |
| **"Say it again"** | `messages.speech` / `step.audio` | Replays the current step instruction from the start | Replays audio/TTS | **PASS** |

---

## 3. Explain-This-Field Mode & Privacy Audit

- **Toggle Button**: Integrated into bubble header with search icon (`🔍`), turns active indigo when enabled.
- **Label Extraction**: Safely inspects strictly:
  1. `aria-label` and `title` attributes
  2. Associated `<label for="...">`
  3. Enclosing `<label>` or preceding table/form-group headers
  4. Curated guide descriptions in `page.fieldExplanations`
- **Zero Input Inspection**: Code verification confirms **ZERO** access to `element.value`.
- **Sensitive Field Safety**: Passwords, OTP, PIN, Aadhaar, and CAPTCHA fields are automatically caught by `_isSensitiveElement` and trigger:
  > *"This is a secure input field. GovGuide never reads, stores, or inspects your personal values."*

---

## 4. Document Checklist & Persistence

- **Drawer Component**: Embedded in speech bubble, collapsible via header or close button.
- **Storage Scope**: Checkbox states stored in `chrome.storage.local` under `govguide_checklist_<flowId>`.
- **Flow Isolation**: Sarathi (`govguide_checklist_apply_ll`) and Passport Seva (`govguide_checklist_explore_passport_services`) maintain isolated checklist state.
- **Checked Styling**: Strike-through styling and muted text applied immediately on user tick.

---

## 5. Mascot Dragging & Inactivity Nudge

- **Drag Repositioning**: Mouse and touch listeners allow dragging mascot anywhere on screen.
- **Position Persistence**: Clamped coordinates saved in `chrome.storage.local` under `govguide_mascot_pos`. Restores cleanly on reload.
- **Inactivity Nudge**:
  - Timer: 20 seconds of user inactivity.
  - Frequency: Fires at most **once per step**.
  - Message: *"Take your time. Whenever you are ready, follow the highlighted step or click 'Next'."*
  - Toggle: User can enable/disable in extension popup (`govguide_nudge_enabled`).

---

## 6. Accessibility & Reduced Motion

- **`prefers-reduced-motion`**: Tested with media query override; all floating, bobbing, celebratory bounces, and pulse rings collapse to static transforms without animation loops.
- **Focus Rings**: 3px visible outline on buttons, chips, and selects.
- **Keyboard Reachable**: `Enter` / `Space` triggers chips, checklist ticks, and dialog buttons.

---

## 7. Zero Regression Check

- **Sarathi Parivahan (Delhi LL)**: 7 pages verified. All step triggers and matching rules intact.
- **Passport Seva**: 8 pages verified. All advisory, calculator, locator, and auth boundaries intact.
- **Registry**: Correct guide loaded per domain.
