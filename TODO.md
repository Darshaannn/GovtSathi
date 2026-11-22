# Mission: "What's Next" Layer with Official Sources & Trust Levels

- [x] 1. DEV-TIME RESEARCH (Official government sources only: gov.in / nic.in / portal manuals):
  - [x] Research Sarathi (Delhi) post-Applicant Category stages (Aadhaar eKYC vs non-Aadhaar, personal details, document & photo/sig upload, fee payment, test slot booking, LL test day). Record source URLs & retrievedOn dates.
  - [x] Research Passport Seva post-Document Advisor stages (registration, form filling, fee payment, appointment booking, PSK visit items, post-visit tracking). Record source URLs & retrievedOn dates.
  - [x] Save research notes in `research/` (ignored by git).
  - [x] Identify any unsourced items and create `docs/unsourced-items.md`.

- [x] 2. GUIDE SCHEMA ADDITIONS:
  - [x] Add `whatsNext` array to relevant pages/flows in `guides/parivahan/sarathi-ll.json`.
    - Each item: `id`, `order`, `title`, `explanation` (multilingual + English `spoken`), `trust` (`verified_page` | `official_document` | `unverified`), `source` (`{title, url, retrievedOn}` for `official_document`), `explainOnly: true`.
    - Safety reminders included: documents ready, never share OTP, payment strictly on official portal.
    - Convert existing unverified screens 6 & 7 into `whatsNext` items with official sources or `unverified`.
  - [x] Add `whatsNext` array to `guides/passportseva/passportseva-main.json` with official sources.
  - [x] Review language status: English (`reviewed: true`), Hindi (marked with note), other 9 languages fallback to English (`reviewed: false`).

- [x] 3. ENGINE & UI UPGRADE:
  - [x] Update `engine/languages.js`: Add UI strings for trust badges ("Seen on page", "From official document", "Not verified"), 180-day stale warning ("This may have changed. Check the portal."), unverified warning ("Not verified. The portal may be different."), "Open official source", spoken intro for trust level.
  - [x] Update `engine/speech-bubble.js`:
    - Add "What's next" preview card / list inside speech bubble when chip is clicked.
    - Render trust badges (`verified_page`, `official_document`, `unverified`).
    - For `official_document`, render source title, retrieved date, and safe link (`target="_blank" rel="noopener noreferrer"`).
    - If `retrievedOn` > 180 days old, show stale warning message.
    - If `unverified`, show unverified warning message.
    - Touch targets min 44px, keyboard accessible, responsive down to 360px, Light/Dark theme.
  - [x] Update `engine/mascot-ui.js` / `engine/step-runner.js`:
    - Mascot expression: `thinking` while preview loads/speaks; switch to `confused` only if an item is `unverified`.
    - Spoken phrasing: Speak trust level plain-words intro only ONCE per preview list.
    - Strict rule: `whatsNext` items NEVER create a spotlight, pointer, or done-trigger.

- [x] 4. DOCUMENTATION:
  - [x] Update `docs/writing-a-guide.md` with the full `whatsNext` schema specification and trust level rules.

- [x] 5. TESTING & VERIFICATION:
  - [x] Phase 1 (offline test suite): Schema validation, valid allowed domains (`gov.in`, `nic.in`), 180-day stale date logic, no empty strings, English fallback, zero spotlight/trigger creation, privacy grep (0 `.value` reads, 0 runtime network calls), regression check on Sarathi & Passport Seva.
  - [x] Phase 2 (live read-only test): Mount extension on live Sarathi and Passport Seva, test "What's next" chip preview, trust badge rendering, external link opening, zero console errors.

- [x] 6. GIT COMMIT & FINAL REPORT:
  - [x] Commit all code, docs, and test files and push to GitHub.
  - [x] Write final report with items per trust level, unsourced items, and tested vs assumed.
