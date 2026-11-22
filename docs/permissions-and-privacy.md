# Permissions and Privacy Architecture

GovGuide is designed with a strict zero-knowledge architecture.

## 1. Extension Permissions Declared

The extension requests exactly **one** manifest permission:

```json
"permissions": [
  "storage"
]
```

### Why `storage` is needed:
- `chrome.storage.local`:
  - `govguide_user_lang_pref`: Remembers your selected language (e.g. `'hi'`).
  - `govguide_selected_voice_uri`: Remembers your selected voice identifier.
  - `govguide_speech_speed_pref`: Remembers speech rate (`'slow'`, `'normal'`, `'fast'`).
  - `govguide_text_size_pref`: Remembers text size (`'small'`, `'medium'`, `'large'`).
  - `govguide_nudge_enabled`: Remembers whether 20-second inactivity nudges are enabled.
  - `govguide_mascot_pos`: Remembers where you dragged the mascot `{ x, y }`.
  - `govguide_checklist_<flowId>`: Remembers checked boxes in your document checklist.
- `chrome.storage.session`:
  - Remembers current flow ID and page ID across page reloads during an active application session.

### What is NEVER Stored:
- No names, addresses, phone numbers, or dates of birth.
- No Aadhaar or PAN numbers.
- No passwords, login IDs, OTP tokens, or CAPTCHA strings.
- No history of websites visited outside registered government guide patterns.

---

## 2. Zero External Network Requests

- **Runtime Isolation**: The extension makes **0 HTTP/HTTPS requests** to any external server, analytics endpoint, or cloud service.
- **Local Assets Only**: JSON guides and mascot SVGs are loaded entirely from within the local extension bundle via `chrome.runtime.getURL()`.

---

## 3. Strict Form Input Privacy Guarantee

- GovGuide **NEVER reads or inspects `element.value`** on any form inputs.
- Event listeners are bound strictly to `click` (e.g., buttons and links) and `change` (e.g., dropdown selection change).
- In Explain-This-Field mode, GovGuide reads strictly metadata: `<label>`, `aria-label`, or static button text.
- Sensitive fields (passwords, OTP, PIN, Aadhaar, CAPTCHA) are intercepted by safety heuristics to prevent reading any context and display a security reminder.

---

## 4. Microphone & Voice Input Privacy

- GovGuide contains an optional experimental voice search button (`🎤`).
- Voice input uses the browser's built-in `webkitSpeechRecognition`.
- **Consent Gate**: GovGuide displays a clear consent notice before initializing microphone capture, explaining that browser speech recognition may send audio to the browser vendor (Google or Microsoft) for transcription.
- No audio recordings are ever stored or transmitted by GovGuide.
