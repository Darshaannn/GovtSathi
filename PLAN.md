# Upgrade Plan: UI Polish (A), Cleaner Human Voice (B), Multilingual Expansion (C)

## 1. Overview & Objectives
- **A. UI Polish**:
  - Modern speech bubble (rounded corners, soft shadows, dynamic tail, high contrast, typography).
  - Smooth mascot movement easing, idle floating, speaking pulse animation.
  - Step progress indicator ("Step X of Y").
  - Clean touch-accessible control buttons (min 44px target) with SVG icons, visible focus states, aria-labels, and tooltip titles.
  - Non-covering smart bubble repositioning logic avoiding highlighted target rects, adaptive on mobile/narrow screens (down to 360px).
  - Softer dim spotlight overlay with animated pulsating target ring.
  - Text-size control (small/medium/large) persisted in storage.
  - Automatic light/dark mode honoring system preferences.
  - Respect `prefers-reduced-motion: reduce`.
  - Modernized popup & privacy consent dialog matching this aesthetic.

- **B. Voice Engine**:
  - Voice ranking & selection prioritizing exact locale matches (`hi-IN`, `mr-IN`, etc.), natural/neural/online descriptors over basic fallback voices.
  - Asynchronous voice loading handling (`voiceschanged`).
  - Voice picker in popup with real-time test voice preview button.
  - Speech rate control (slow: 0.85, normal: 1.0, fast: 1.2) persisted in storage.
  - Natural speech processing: phrase chunking, symbol/URL stripping, smart punctuation pauses. Avoid repeating the independent helper label aloud on every step.
  - Pre-recorded audio fallback support (`step.audio[lang]` audio playback before TTS fallback).
  - Fallback polite notice when no voice package is available.
  - Privacy and voice setup documentation in `README.md`.

- **C. Languages & Localization**:
  - Central language metadata directory (`engine/languages.js` or `guides/languages.json`) defining: code, English name, native name, TTS locale, text direction, and `reviewed` status.
  - 11 Supported languages:
    - English (`en`, `reviewed: true`)
    - Hindi (`hi`, `reviewed: true`)
    - Marathi (`mr`, `reviewed: false`)
    - Gujarati (`gu`, `reviewed: false`)
    - Bengali (`bn`, `reviewed: false`)
    - Tamil (`ta`, `reviewed: false`)
    - Telugu (`te`, `reviewed: false`)
    - Kannada (`kn`, `reviewed: false`)
    - Malayalam (`ml`, `reviewed: false`)
    - Punjabi (`pa`, `reviewed: false`)
    - Odia (`or`, `reviewed: false`)
  - Full translation of all messages and fallbacks in `guides/parivahan/sarathi-ll.json` and UI strings.
  - Official button terms (e.g. *"Apply for Learner Licence"*, *"Continue"*) retained in English within translated text for exact visual matching.
  - Review status badge in bubble: "Translation not yet checked by a native speaker" (localized) for `reviewed: false`.
  - Robust fallback to English on any missing translation key (never blank or undefined).
  - Cross-platform system font stack with script fallbacks (Noto Sans / Nirmala UI / Mangal / etc.) preventing empty tofu boxes without remote font calls.

## 2. Files to Touch & Create
- `engine/languages.js`: Central metadata definitions & UI localized string table.
- `engine/shadow-dom.js`: Updated shadow stylesheet for light/dark mode, text sizes, pulse ring animations, speech bubble tail, button sizing (44px), focus rings, and reduced motion.
- `engine/speech-bubble.js`: Bubble UI rendering with step progress, text size switcher, unreviewed translation notice, non-target-covering dynamic positioning, and ARIA live regions.
- `engine/speech-service.js`: Voice ranking, speech rate control, pre-recorded audio handling, natural text parsing, and `voiceschanged` lifecycle.
- `engine/mascot-ui.js`: Easing transitions, idle floating animation, speaking pulse animation.
- `engine/highlighter.js`: Enhanced spotlight geometry, softer dim, pulsating ring, and resize/scroll observer re-alignment.
- `engine/step-runner.js`: Audio playback coordination, speech rate/text-size state persistence, language resolution with fallback to English.
- `popup/popup.html`, `popup/popup.css`, `popup/popup.js`: Voice picker with test voice preview, speed toggle, text-size toggle, language selection, modern styling.
- `guides/parivahan/sarathi-ll.json`: Complete translations for all 11 languages across all pages/steps.
- `manifest.json`: Ensure new script files are included in content script and web accessible resources.
- `README.md`, `TODO.md`, `TEST-PHASE-1.md`, `TEST-PHASE-2.md`.
