# Voice Engine & Audio Architecture

GovGuide uses the browser's built-in Web Speech API (`window.speechSynthesis`) to provide spoken guidance in the user's chosen language.

---

## 1. Native Browser Speech Synthesis

- **Runs 100% locally**: The voice engine does not send citizenship details or user inputs to external servers.
- **Intelligent Voice Ranking**: Evaluates all installed system voices. For Indian English (`en-IN`), it automatically ranks natural/neural voices first (e.g. Neerja, Heera, Veena, or Google India English).
- **Graceful Fallback**: If an operating system lacks a voice for a specific language (e.g., Odia or Malayalam on certain Windows installations), GovGuide displays a polite notice and renders full text instructions without crashing.

---

## 2. Spoken Scripts vs. Bubble Text

Every step in a guide can provide two distinct text fields:
1. **`bubble`**: Concise, scannable text displayed on screen inside the speech bubble.
2. **`spoken`** (optional): Warm, conversational Indian-English phrasing used exclusively for audio/TTS playback (e.g., *"Okay, so to get started, please select your state..."*).

If `spoken` is absent, the engine falls back to `speech` and then to `bubble`.

---

## 3. Pre-Recorded Audio Architecture

The engine supports pre-recorded audio playback via `step.audio[lang]`:
- If an MP3 audio path is provided and reachable, GovGuide plays the pre-recorded audio.
- If the audio fails to load or is not bundled, GovGuide smoothly falls back to browser TTS.
- *Note:* To keep the extension bundle lightweight and repository clean, no pre-recorded MP3 audio files are currently bundled in git. Pre-recorded audio generation tooling is maintained in `tools/generate-audio.js`.
