# TODO List - GovGuide Parivahan LL Bugfix & Full Verification

- [x] 1. DIAGNOSE: compare each captured page's real URL/title (captures/parivahan/notes.txt) against the match rules in guides/parivahan/sarathi-ll.json. Check how the engine picks the current page after load. Check each capture for iframes. Write findings to DEBUG.md.
- [x] 2. FIX ROOT CAUSES: Page detection on load & DOM changes, iframe handling, silent popup skip, explain-only steps for defaults & unverified steps.
- [x] 3. Add "[GovGuide]" debug logging behind ONE flag (default off in final build).
- [x] 4. TEST PHASE 1 (offline, local test harness): Assert matching, target element finding, spotlight rect, single mascot mounting, fallback resilience, EN/HI messages, privacy grep (.value). Save results to TEST-PHASE-1.md.
- [ ] 5. TEST PHASE 2 (live, read-only): Run Playwright with --load-extension against live Sarathi site, walk Delhi flow, verify all pages, screenshots. Save results to TEST-PHASE-2.md.
- [ ] 6. Iterative fix if Phase 2 fails, re-running Phase 1 and Phase 2.
- [ ] 7. CLEANUP: turn debug flag off, update README (Delhi-only, limitations), confirm captures excluded.
- [ ] 8. FINAL REPORT: Short, honest status of tested vs assumed.
