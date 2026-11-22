# Mission: Interactive Mascot & Rich Guidance TODO List

- [x] 1. EXPRESSION STATES (`idle`, `pointing`, `thinking`, `happy`, `confused`):
  - [x] Enhance `assets/mascot-default.svg` with modular elements (pupils, eyebrows, mouth, wings) capable of distinct expression states.
  - [x] Add `setExpression(state)` method to `engine/mascot-ui.js` supporting `idle`, `pointing`, `thinking`, `happy`, `confused`.
  - [x] Add CSS expression animations & styling inside `engine/shadow-dom.js`.
  - [x] Document in `README.md` the exact poses and expression requirements for custom mascot SVGs.

- [x] 2. QUICK-REPLY CHIPS IN SPEECH BUBBLE:
  - [x] Add chip container in `engine/speech-bubble.js` below text body.
  - [x] Implement 5 chips:
    - `"What is this page?"` (reads page `about`)
    - `"What documents do I need?"` (reads page `documents` & toggles checklist)
    - `"I'm stuck"` (reads page `stuck`)
    - `"What's next?"` (reads page `next`)
    - `"Say it again"` (replays speech/audio)
  - [x] Support localized button text in `engine/languages.js` with fallback to English.
  - [x] Add per-page content fields (`about`, `documents`, `stuck`, `next`) in `guides/parivahan/sarathi-ll.json` and `guides/passportseva/passportseva-main.json` (EN with `spoken` + HI, other 9 fallback to EN).

- [x] 3. EXPLAIN-THIS-FIELD MODE:
  - [x] Add toggle button in speech bubble header (`govguide-explain-field-btn`) with active indicator.
  - [x] In `engine/step-runner.js`, implement non-intrusive click listener on form elements (`input`, `select`, `textarea`, `label`).
  - [x] Extract label text / aria-label / guide field explanations.
  - [x] Privacy guarantee: NEVER read `element.value`, NEVER store/transmit input data.
  - [x] Sensitive field safety: If input is password/OTP/Aadhaar/CAPTCHA/login, show generic privacy safe message: *"This is a secure input field. GovGuide never reads or inspects your personal values."*

- [x] 4. DOCUMENT CHECKLIST:
  - [x] Add expandable checklist drawer in `engine/speech-bubble.js` populated from current page/flow `documents`.
  - [x] Persist checkbox tick states per flow in `chrome.storage.local` under `govguide_checklist_<flowId>`.
  - [x] Add reset / clear checklist option or preserve tick states across navigation.

- [x] 5. MASCOT INTERACTION (Drag persistence, celebration, inactivity nudge):
  - [x] Persist draggable position to `chrome.storage.local` (`govguide_mascot_pos`).
  - [x] Celebrate on step done (switch to `happy` expression for ~1.8s).
  - [x] 20-second inactivity nudge: Trigger helpful suggestion once per step; reset on user activity.
  - [x] Add toggle in `popup/popup.html` & `popup/popup.js` for inactivity nudges (`govguide_nudge_enabled`).

- [x] 6. ACCESSIBILITY & RESPONSIVENESS:
  - [x] Respect `prefers-reduced-motion` for all new animations.
  - [x] Keyboard navigation, visible focus rings, ARIA roles/labels for chips, checklist, and toggles.
  - [x] Min 44px hit targets and responsive down to 360px viewport.

- [x] 7. CONTENT ENRICHMENT:
  - [x] Enrich all pages in `guides/parivahan/sarathi-ll.json`.
  - [x] Enrich all pages in `guides/passportseva/passportseva-main.json`.

- [x] 8. TESTING & VERIFICATION:
  - [x] Phase 1: Offline automated test suite (`TEST-PHASE-1-INTERACTIVE.md`) testing expressions, chips, explainer, checklist, drag persistence, nudge, privacy grep, zero regression.
  - [x] Phase 2: Live read-only verification on Parivahan Sarathi & Passport Seva (`TEST-PHASE-2-INTERACTIVE.md`).

- [x] 9. DOCUMENTATION & REPO COMMIT:
  - [x] Update `README.md` with new features and custom mascot guide.
  - [x] Commit all changes and push to GitHub.
