# GovGuide (GvtSathi) - Indian Government Website Guide 🧭

> **A friendly visual guide and on-screen companion for citizens navigating complex Indian government portals.**

GovGuide is a privacy-first, lightweight Google Chrome extension (Manifest V3). When a citizen visits supported Indian government portals (such as **Parivahan Sarathi** for driving licences), GovGuide displays an on-screen mascot companion. The mascot moves across the page, shines an interactive spotlight ring on exactly what link, dropdown, or button to interact with, speaks instructions aloud in the user's chosen language, and explains each step in simple, human words.

---

## 📑 Table of Contents
1. [Why This Project Exists](#-why-this-project-exists)
2. [Key Features & Upgrades](#-key-features--upgrades)
3. [Supported Languages & Review Process](#-supported-languages--review-process)
4. [Voice Engine & Speech Quality](#-voice-engine--speech-quality)
5. [How It Works (Architecture)](#-how-it-works-architecture)
6. [Current Support & Verified Flows](#-current-support--verified-flows)
7. [Privacy & Safety Guarantees](#-privacy--safety-guarantees)
8. [How to Install (Load Unpacked in Chrome)](#-how-to-install-load-unpacked-in-chrome)
9. [How to Run and Use It](#-how-to-run-and-use-it)
   - [Option A: Try the Built-In Offline Demo Portal (Recommended first!)](#option-a-try-the-built-in-offline-demo-portal-recommended-first)
   - [Option B: Use on the Live Parivahan Portal](#option-b-use-on-the-live-parivahan-portal)
10. [Controls & On-Screen UI Guide](#-controls--on-screen-ui-guide)
11. [Project File Structure](#-project-file-structure)
12. [How to Add a New Language (Translation Guide)](#-how-to-add-a-new-language-translation-guide)
13. [How to Add New Portal Guides (For Contributors)](#-how-to-add-new-portal-guides-for-contributors)
14. [Troubleshooting & FAQ](#-troubleshooting--faq)
15. [Disclaimer](#-disclaimer)

---

## 🎯 Why This Project Exists

Most government online portals are built with administrative terminology, nested dropdowns, and legacy layouts. While cyber-cafe operators and agents navigate them daily, ordinary citizens often find them confusing or intimidating:
- Which button starts a *new* application vs. a *renewal*?
- Why did a pop-up appear, and how do I dismiss it safely?
- What documents or preparation steps are actually required?

### What GovGuide Does:
- **Shows you where to go:** Highlights exact buttons, dropdowns, and cards with a soft, glowing spotlight and animated pulse ring.
- **Speaks & Explains:** Uses Text-to-Speech (TTS) and speech bubbles in 11 Indian languages so anyone can follow along.
- **Never does the work for you:** You retain 100% control over typing, clicking, reviewing, and submitting.
- **Independent & Safe:** Zero reading of personal details, zero backend tracking, zero passwords or OTP interception.

---

## 🚀 Key Features & Upgrades

### A. UI Polish
- **Modern Speech Bubble:** Rounded corners (18px), soft ambient box-shadow, readable system typography, and a directional tail pointing towards the mascot.
- **Smart Non-Covering Positioning:** The speech bubble automatically detects the position of the highlighted button/form element and moves away from it so the target is never obscured.
- **Responsive on Small Screens:** Automatically scales down to mobile viewports (down to 360px) without horizontal clipping.
- **Smooth Mascot Animation:** Fluid movement easing, gentle idle floating animation, and an active speaking pulse animation when speech plays.
- **Step Progress Indicator:** Clear progress counter in the bubble (e.g. *"Step 2 of 5"* / *"चरण 2 का 5"*).
- **Text Size Controls:** One-click toggle between **Small (13.5px)**, **Medium (15px)**, and **Large (17.5px)** text, saved as a user preference.
- **Light & Dark Theme:** Follows system `prefers-color-scheme` automatically with high-contrast text and dark surfaces.
- **Accessibility:** Minimum 44px touch targets on all buttons, visible keyboard focus outlines (`:focus-visible`), ARIA live regions for screen readers, and full compliance with `prefers-reduced-motion: reduce`.

### B. Natural Voice Engine
- **Intelligent Voice Ranking:** Evaluates installed OS voices and automatically picks the highest quality voice (prefers natural/neural/online voices and exact locale match like `hi-IN` over generic fallbacks).
- **Voice Selection & Testing in Popup:** Test and choose from all voices installed on your device for your selected language.
- **Speech Speed Control:** Choose between **Slow (0.85x)**, **Normal (1.0x)**, and **Fast (1.2x)** speech playback.
- **Natural Phrasing:** Automatically strips technical URLs, file extensions (`stateSelectBean.do`), and raw quotes, pausing naturally at commas and sentences. Never speaks the disclaimer label every step.
- **Pre-recorded Audio Playback Support:** If a guide step references an audio file (`step.audio[lang]`), GovGuide will play the audio file before falling back to TTS.
- **Graceful Fallback:** If your operating system lacks a voice for a chosen language, GovGuide displays a polite notice and shows clear text instructions.

### C. Multilingual Support (11 Languages)
GovGuide supports 11 Indian languages out of the box with zero external font downloads (uses system font stacks with Noto Sans / Nirmala UI fallbacks):
- English (`en`) - Reviewed ✅
- हिन्दी - Hindi (`hi`) - Reviewed ✅
- मराठी - Marathi (`mr`) - Unreviewed ⚠️
- ગુજરાતી - Gujarati (`gu`) - Unreviewed ⚠️
- বাংলা - Bengali (`bn`) - Unreviewed ⚠️
- தமிழ் - Tamil (`ta`) - Unreviewed ⚠️
- తెలుగు - Telugu (`te`) - Unreviewed ⚠️
- ಕನ್ನಡ - Kannada (`kn`) - Unreviewed ⚠️
- മലയാളം - Malayalam (`ml`) - Unreviewed ⚠️
- ਪੰਜਾਬੀ - Punjabi (`pa`) - Unreviewed ⚠️
- ଓଡ଼ିଆ - Odia (`or`) - Unreviewed ⚠️

---

## 🌐 Supported Languages & Review Process

GovGuide maintains a transparent review status for every language:
- **`reviewed: true`**: The translation has been verified by a native speaker.
- **`reviewed: false`**: The translation has been generated for initial coverage. An unobtrusive warning badge is displayed in the speech bubble:
  > *"Translation not yet checked by a native speaker"* (translated into the chosen language).

### Preserving Official English UI Labels:
To prevent user confusion on government websites, official terms (such as *"Apply for Learner Licence"*, *"Continue"*, and *"Submit"*) are **always retained in English within the translated sentence** so users can visually match the text on their screen.

---

## 🎙️ Voice Engine & Speech Quality

### Understanding Browser Voice Quality:
GovGuide uses your browser's native Web Speech API (`SpeechSynthesis`). This means speech synthesis runs **100% locally on your computer/phone** without sending your form data anywhere.

> **Privacy Note on "Online" Voices:** Some modern operating systems (like Windows 11 and ChromeOS) provide high-definition "Online / Natural" voices provided by Microsoft or Google. When using an online voice, the text of the government guide step is synthesized via the browser vendor. This text is **only public government guide text, never user data or form values**.

### How to Install High-Quality Voices on Your OS:
If a language sounds robotic or is missing on your device:
- **Windows 10 / 11:**
  1. Open **Settings** &rarr; **Time & Language** &rarr; **Speech**.
  2. Under *Manage voices*, click **Add voices**.
  3. Search for your language (e.g., *Hindi*, *Marathi*, *Tamil*, *Telugu*, *Bengali*) and click **Install**.
  4. Ensure the *Speech pack* with Natural voices is checked.
- **macOS:**
  1. Open **System Settings** &rarr; **Accessibility** &rarr; **Spoken Content**.
  2. In *System Voice*, click the dropdown and choose **Manage Voices...**.
  3. Download the enhanced version of your preferred Indian language voice.
- **Android:**
  1. Open **Settings** &rarr; **System** &rarr; **Languages & Input** &rarr; **Text-to-speech output**.
  2. Tap the settings gear next to *Speech Services by Google* &rarr; **Install voice data**.
  3. Select your language and download the high-quality voice pack.

---

## 🏗️ How It Works (Architecture)

GovGuide is cleanly separated into two distinct layers:

```
┌────────────────────────────────────────────────────────┐
│                   WEBSITE IN BROWSER                   │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Shadow DOM Root (#govguide-root-host)        │  │
│  │                                                  │  │
│  │   ┌───────────────┐        ┌─────────────────┐   │  │
│  │   │  Highlighter  │        │  Speech Bubble  │   │  │
│  │   │  (Spotlight)  │        │ (Text & Voice)  │   │  │
│  │   └───────┬───────┘        └────────┬────────┘   │  │
│  │           │                         │            │  │
│  │           ▼                         ▼            │  │
│  │   ┌──────────────────────────────────────────┐   │  │
│  │   │              CORE ENGINE                 │   │  │
│  │   │  - languages.js       - mascot-ui.js     │   │  │
│  │   │  - element-finder.js  - speech-bubble.js │   │  │
│  │   │  - step-runner.js     - speech-service.js│   │  │
│  │   └───────────────────▲──────────────────────┘   │  │
│  └───────────────────────┼──────────────────────────┘  │
└──────────────────────────┼─────────────────────────────┘
                           │ Loads JSON declarative rules
             ┌─────────────┴─────────────┐
             │    DECLARATIVE GUIDES     │
             │  - registry.json          │
             │  - sarathi-ll.json        │
             │  - demo-guide.json        │
             └───────────────────────────┘
```

1. **The Core Engine** (`/engine`): Generic, site-agnostic JavaScript. Handles DOM injection, speech ranking, dragging, non-covering positioning, and step state progression.
2. **Declarative Site Guides** (`/guides`): Pure JSON files defining URLs, matching rules, target selectors, and translations across all 11 languages.

---

## 📍 Current Support & Verified Flows

GovGuide includes complete, verified guidance for:

### 1. Parivahan Sarathi - Learner's Licence Flow (`sarathi-ll.json`)
*Verified for Delhi (`DL`) transport portal:*
- **Page 1: State Selection** (`/sarathiservice/stateSelection.do`)
  - Identifies the state selection dropdown (`select#stfNameId`) and instructs user to pick their state.
- **Page 2: Contactless Services Announcement** (`stateSelectBean.do`)
  - Detects the modal popup (`#contactless_statepopup`) and points out the `x` close button.
  - Automatically skips if the modal is absent or closed.
- **Page 3: State Services Dashboard** (`stateSelectBean.do`)
  - Locates the visible **"Apply for Learner Licence"** service card and points the user to click it.
- **Page 4: Instructions Page** (`/sarathiservice/newLLDet.do`)
  - Explains the sequence of stages (Fill details, upload documents, photo/signature, fee payment).
  - Highlights the **"Continue"** button at the bottom of the page.
- **Page 5: Applicant Category Selection** (`/sarathiservice/newLL_displayNewLL.do`)
  - Explains default selections (*General* category and *Applicant does not hold any licence*).
  - Runs in **Explain-Only Mode** (no intrusive pointers, purely informative).

---

## 🔒 Privacy & Safety Guarantees

GovGuide was engineered under strict zero-trust privacy constraints:

- ❌ **NEVER Reads Form Input Values**: The extension never inspects, reads, transmits, or stores values typed into form fields (such as Aadhaar numbers, mobile numbers, passwords, dates of birth, or addresses).
- ❌ **NO Network Calls**: The extension makes **zero** background HTTP requests to external analytics, servers, or tracking APIs. All logic and JSON guides run strictly inside your browser.
- ❌ **NO Auto-Submit or Bot Actions**: GovGuide never fills forms automatically, never clicks "Submit" on legal forms, and never bypasses CAPTCHA or OTP challenges.
- 🔒 **Minimal Permissions**: Uses only `storage` (to remember your language, voice, speed, and text-size choice locally) and domain-specific content script injection.

---

## 📦 How to Install (Load Unpacked in Chrome)

1. Open Google Chrome on your computer.
2. In the Chrome address bar, type:
   ```text
   chrome://extensions
   ```
   and press **Enter**.
3. In the top-right corner, toggle **Developer mode** to **ON**.
4. In the top-left corner, click the **Load unpacked** button.
5. In the folder browser dialog, select the project directory:
   ```text
   d:\Darshan\Coding\Mine\Projects\GvtSathi
   ```
6. Click **Select Folder**.
7. **Done!** GovGuide will appear in your extensions list.

---

## 🖥️ How to Run and Use It

### Option A: Try the Built-In Offline Demo Portal (Recommended first!)

1. Click the **GovGuide** icon in your Chrome toolbar.
2. In the popup window, click **"Open Test Portal"**.
3. *Alternative:* Open:
   ```text
   chrome-extension://<EXTENSION_ID>/demo/demo.html
   ```
4. Experience step navigation, language switching, voice controls, and text size adjustment.

### Option B: Use on the Live Parivahan Portal

1. Navigate to `https://sarathi.parivahan.gov.in/`.
2. GovGuide will activate on the state selection screen.
3. Follow the mascot instructions, select your language, and click through the application stages.

---

## 🎮 Controls & On-Screen UI Guide

| Control | Icon | What It Does |
| :--- | :---: | :--- |
| **Language Toggle** | Dropdown | Switch between all 11 supported languages. |
| **Text Size** | `aA` | Cycle between Small, Medium, and Large text sizes. |
| **Mute / Unmute** | 🔊 / 🔇 | Toggle voice reading on or off. |
| **Repeat Step** | 🔄 | Re-reads and re-speaks the current step instruction. |
| **Voice Search** | 🎤 | Speak your goal (opt-in with one-time privacy consent). |
| **Minimize** | `—` | Collapses the mascot into a small, floating pill in the corner. |
| **Next / Prev** | Back / Next | Manually navigate forward or backward through guide steps. |
| **Drag** | Mouse / Touch | Drag the mascot anywhere on screen. |

---

## 📂 Project File Structure

```text
GvtSathi/
├── manifest.json              # Chrome Extension MV3 manifest & permissions
├── assets/                    # Mascot assets & swappable configuration
│   ├── mascot-default.svg     # Friendly SVG character with compass emblem
│   └── mascot-config.js       # Mascot appearance, dimensions & pointing offsets
├── engine/                    # Core Engine (strictly portal-agnostic)
│   ├── languages.js           # Central 11-language registry & UI localization
│   ├── shadow-dom.js          # Shadow DOM manager (#govguide-root-host) & styles
│   ├── highlighter.js         # Soft SVG spotlight overlay with pointer-events: none
│   ├── element-finder.js      # Multi-tier selector engine (ID -> CSS -> Text -> Container)
│   ├── speech-service.js      # Web Speech API (ranking, voice speed & audio support)
│   ├── speech-bubble.js       # Modern speech bubble with non-covering positioning
│   ├── mascot-ui.js           # Mascot DOM, natural easing, idle bobbing & speaking animation
│   ├── step-runner.js         # State machine, DOM observer & English fallback
│   └── content-script.js      # Bootstrapper matching URLs to guides
├── guides/                    # Declarative Portal Guides (Pure JSON)
│   ├── registry.json          # Master directory of supported websites & URL patterns
│   └── parivahan/
│       └── sarathi-ll.json    # Parivahan Learner's Licence guide (11 languages)
├── popup/                     # Chrome Extension Action Popup
│   ├── popup.html             # Popup with language, voice picker & speed controls
│   ├── popup.css              # Dark & light theme popup styles
│   └── popup.js               # Voice testing preview & settings persistence
├── demo/                      # Standalone Test & Demo Suite
│   ├── demo.html              # Mock government portal harness
│   ├── demo.css               # Portal styling
│   └── demo-guide.json        # Test workflow guide
├── icons/                     # Extension branding icons (16, 48, 128 px)
├── TEST-PHASE-1.md            # Offline multi-language verification suite report
├── TEST-PHASE-2.md            # Live portal read-only verification report
└── README.md                  # Complete documentation (this file)
```

---

## ✍️ How to Add a New Language (Translation Guide)

To add another language or review an existing unreviewed language:

1. **Add Language Metadata in [`engine/languages.js`](engine/languages.js):**
   ```javascript
   {
     code: 'as', // e.g., Assamese
     englishName: 'Assamese',
     nativeName: 'অসমীয়া',
     ttsLocale: 'as-IN',
     direction: 'ltr',
     reviewed: false // Set to true once verified by a native speaker
   }
   ```
2. **Add UI String Translations:** In [`engine/languages.js`](engine/languages.js), add the language code to `UI_STRINGS` for all buttons, notices, and labels.
3. **Add Step Translations in Guides:** In [`guides/parivahan/sarathi-ll.json`](guides/parivahan/sarathi-ll.json), add the new language code under `supportedLanguages` and under each step's `messages` and `fallback`. Keep official button terms (like *"Continue"*) in English.
4. **Update Popup:** Add the `<option value="as">` to [`popup/popup.html`](popup/popup.html).

---

## 🛠️ How to Add New Portal Guides (For Contributors)

1. Register the portal in [`guides/registry.json`](guides/registry.json).
2. Create `guides/<portal-id>/<workflow-id>.json`.
3. Include page matching rules, steps, and bilingual or multilingual messages.

---

## ❓ Troubleshooting & FAQ

### 1. I loaded the extension, but the mascot doesn't appear on the page.
- Make sure the URL you are visiting matches a supported pattern in [`guides/registry.json`](guides/registry.json).
- If testing locally, open the built-in demo page: `chrome-extension://<EXTENSION_ID>/demo/demo.html`.

### 2. Why does the speech bubble say "Translation not yet checked by a native speaker"?
- Languages marked with `reviewed: false` display this notice to maintain transparency. Once a native speaker reviews the wording, the flag can be changed to `reviewed: true`.

### 3. Does GovGuide store my Aadhaar number or phone number?
- **Never.** GovGuide does not read the `.value` property of any form inputs. Its listeners only detect *that* a button was clicked or a dropdown was changed.

---

## ⚖️ Disclaimer

**Independent Civic Helper Project**: GovGuide is an independent, open-source educational project. It is **not affiliated with, endorsed by, or officially associated with the Government of India**, the Ministry of Road Transport and Highways (MoRTH), NIC, or any state government department. All government portal names, trademarks, and logos belong to their respective authorities.
