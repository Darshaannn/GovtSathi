# TEST PHASE 3: Voice Quality, Spoken Scripts, and Audio Fallback

**Date**: 2026-11-09  
**Status**: PASSED (All checks green)

---

## 1. Automated Unit & Offline Test Results

| Test Case | Description | Result | Details |
|---|---|:---:|---|
| **Voice Ranking Heuristics** | Mocked voice lists with Neerja, Heera, Ravi, David, Zira | **PASS** | `Microsoft Neerja Online (Natural)` ranked #1; `Microsoft Heera` ranked #2. |
| **No en-IN Fallback** | Mocked list with no `en-IN` voice | **PASS** | Top choice safely falls back to English female natural (`Zira Natural`), then other English voices. |
| **Spoken Script Fallback** | `step.messages.en.spoken` vs `speech` vs `bubble` | **PASS** | Uses `spoken` for speech and TTS when present; `bubble` text remains clean and unchanged. Missing `spoken` correctly falls back to `speech`. |
| **Audio Playback Path** | Step has valid `step.audio.en` MP3 | **PASS** | Audio created with `chrome.runtime.getURL()` and played with proper speed multiplier; triggers `onSpeakingChange` for mascot bobbing. |
| **Audio Error & Missing Fallback** | Audio missing or network/load failure | **PASS** | Silently catches playback errors and falls back to browser SpeechSynthesis without throwing unhandled exceptions. |
| **Audio Generator Dry-Run** | `node tools/generate-audio.js --dry-run` | **PASS** | Successfully parsed all 10 steps across 7 Delhi screens. Character count: **1,398 characters**. Negligible impact on cloud free-tiers. |
| **Audio Generator Mock Mode** | `node tools/generate-audio.js --provider=mock` | **PASS** | Generated 10 test MP3s in `assets/audio/en/` and automatically linked `step.audio.en` in `guides/parivahan/sarathi-ll.json`. |
| **Delhi Walk Offline Harness** | Walk all 5 captured Delhi Parivahan screens | **PASS** | Matched `screen_01_state_selection`, `screen_02_contactless_popup`, `screen_03_state_dashboard`, `screen_04_instructions`, and `screen_05_applicant_category` with 100% accuracy. |
| **Privacy Audit** | Search `.value` and network calls in `engine/` & `popup/` | **PASS** | 0 form field `.value` reads. 0 external network requests (only local `chrome.runtime.getURL()` fetches). |
| **Package Hygiene** | Git exclusion check | **PASS** | `tools/`, `captures/`, `Capture/`, and temporary scripts are excluded via `.gitignore`. |

---

## 2. English "Spoken" Script Sample & Naturalness Check

- **Step 1 (State Selection)**:
  > *"Okay, so to get started, please select your state from this dropdown menu. Once you choose Delhi, the portal will open up your state services."*
- **Step 2 (Contactless Popup)**:
  > *"Alright, now there is a small notice popup on the screen about contactless services. Just click the cross icon in the corner to close it."*
- **Step 3 (Dashboard Apply LL)**:
  > *"Now, uh, look right here under Driving Licence services, and click on Apply for Learner Licence to begin your application."*
- **Step 4 (Instructions)**:
  > *"Okay, so these are the five application stages you will go through. Just take a quick look, and then click the Continue button at the bottom."*
- **Step 5 (Applicant Category)**:
  > *"Here, the category is already set to General. Hmm, unless you belong to a special category like defence or divyang, just leave it as it is."*

**Tone & Safety Verification**:
- Conversational phrasing: Gentle, human Indian-English cadence ("Okay, so", "Alright, now", "Just").
- Hesitation rate: Light natural hesitation ("uh", "hmm") appears on exactly 2 out of 10 steps (~1 in 5 steps).
- Critical step isolation: Steps involving Aadhaar OTP, verification boundaries, and application stages contain **zero** hesitations or ambiguities for maximum clarity and safety.
