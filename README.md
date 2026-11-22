# GovGuide (GvtSathi) - Indian Government Website Guide 🧭

> **A friendly visual guide and on-screen companion for citizens navigating complex Indian government portals.**

GovGuide is a privacy-first, lightweight Google Chrome extension (Manifest V3). When a citizen visits supported Indian government portals (such as **Parivahan Sarathi** for driving licences or **Passport Seva** for passport applications), GovGuide displays an on-screen mascot companion. The mascot moves across the page, shines an interactive spotlight ring on exactly what link, dropdown, or button to interact with, speaks instructions aloud in the user's chosen language, and explains each step in simple, human words.

---

## 📑 Table of Contents
1. [Why This Project Exists](#-why-this-project-exists)
2. [Key Features & Upgrades](#-key-features--upgrades)
3. [Interactive Mascot Poses & Customization](#-interactive-mascot-poses--customization)
4. [Quick-Reply Chips & Document Checklist](#-quick-reply-chips--document-checklist)
5. [Explain-This-Field Mode & Privacy](#-explain-this-field-mode--privacy)
6. [Supported Portals & Verified Workflows](#-supported-portals--verified-workflows)
7. [Supported Languages & Review Process](#-supported-languages--review-process)
8. [Voice Engine & Speech Quality](#-voice-engine--speech-quality)
9. [Privacy & Safety Guarantees](#-privacy--safety-guarantees)
10. [How to Install (Load Unpacked in Chrome)](#-how-to-install-load-unpacked-in-chrome)
11. [How to Run and Use It](#-how-to-run-and-use-it)
12. [Controls & On-Screen UI Guide](#-controls--on-screen-ui-guide)
13. [Project File Structure](#-project-file-structure)
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
- **Interactive Companion:** An animated, draggable guide mascot with 5 distinct expression states (`idle`, `pointing`, `thinking`, `happy`, `confused`).
- **Contextual Help & Chips:** Quick-reply chips provide instant answers to *"What is this page?"*, *"What documents do I need?"*, *"I'm stuck"*, and *"What's next?"*.
- **Interactive Document Checklist:** Keep track of your required papers right inside the guide with persistent checkbox ticks.
- **Explain-This-Field Mode:** Click on any form field or label to hear what it means without GovGuide ever reading or logging what you typed.
- **Speaks & Explains:** Uses Text-to-Speech (TTS) and speech bubbles in 11 Indian languages.
- **Never does the work for you:** You retain 100% control over typing, clicking, reviewing, and submitting.
- **Independent & Safe:** Zero reading of personal details, zero backend tracking, zero passwords or OTP interception.

---

## 🚀 Key Features & Upgrades

### A. Interactive Mascot Poses
- **5 Expression States:** `idle` (natural floating bob), `pointing` (forward alert focus), `thinking` (subtle sway with lightbulb), `happy` (celebratory bounce on step completion), and `confused` (puzzled tilt with question mark).
- **Smooth Natural Dragging:** Drag the mascot anywhere on the screen with mouse or touch; its position is remembered across page navigations in `chrome.storage.local`.
- **Inactivity Nudges:** If you remain on a step for ~20 seconds without progressing, the companion gently nudges you with helpful guidance (can be toggled in the popup settings).

### B. Rich Speech Bubble & Quick Help
- **Modern Speech Bubble:** Rounded corners (18px), soft ambient shadow, clear directional tail pointing at the mascot.
- **Step Progress Indicator:** Clear progress counter (e.g. *"Step 2 of 5"* / *"चरण 2 का 5"*).
- **Quick-Reply Chips Bar:** Instant one-click questions at the bottom of the bubble:
  - `❓ What is this page?` (explains page context)
  - `📄 Documents?` (opens interactive checklist)
  - `🆘 I'm stuck` (troubleshooting advice)
  - `⏩ What's next?` (roadmap of remaining milestones)
  - `🔊 Say again` (replays current instruction)
- **Document Checklist Drawer:** Embedded checklist derived from portal guide definitions, persisting ticks per workflow.
- **Text Size Switcher:** One-click toggle between **Small (13.5px)**, **Medium (15px)**, and **Large (17.5px)** text.
- **Light & Dark Theme:** Follows system `prefers-color-scheme` automatically with high contrast.

---

## 🎭 Interactive Mascot Poses & Customization

The mascot companion is 100% swappable via `assets/mascot-config.js` and isolated inside the Shadow DOM (`#govguide-root-host`).

### Required Poses & States for Real Mascot Assets:
If you are designing custom SVG, Lottie, or image assets for the mascot, support the following 5 named expression states:

1. **`idle`**: Neutral resting pose. Gentle sinusoidal vertical floating motion with wings at rest and forward gaze.
2. **`pointing`**: Action state. Dynamic forward posture with one wing or hand extended directly toward the targeted UI element.
3. **`thinking`**: Contemplative state. Eyes looking slightly upward, head tilted, with an optional idea/lightbulb accessory. Used during Explain-This-Field mode, when the user clicks *"I'm stuck"*, or during an inactivity nudge.
4. **`happy`**: Celebration state. Cheerful bounce animation, curved smiling eyes, and open mouth. Triggered for ~1.8 seconds whenever the citizen completes a step.
5. **`confused`**: Perplexed state. Asymmetrical raised eyebrow, quizzical tilt, or question mark indicator. Used when a target element cannot be found or fallback guidance is displayed.

To swap the default mascot asset:
1. Place your new asset in `assets/my-mascot.svg` (or PNG).
2. Edit `assets/mascot-config.js`:
   ```javascript
   const MascotConfig = {
     type: 'svg',
     assetPath: 'assets/my-mascot.svg',
     defaultWidth: 90,
     defaultHeight: 90,
     name: 'Sathi'
   };
   ```

---

## 🔍 Explain-This-Field Mode & Privacy

GovGuide includes a dedicated **Explain-This-Field Mode**:
1. Click the **`🔍`** search icon in the speech bubble header to toggle Explain Mode ON.
2. Click any input field, dropdown, or label on the government form.
3. GovGuide describes what the field is for based strictly on its label, accessibility metadata, or portal guide definition.

### Strict Privacy Guarantee:
- GovGuide **NEVER reads or inspects `element.value`**.
- GovGuide **NEVER logs or stores what you type**.
- On sensitive fields (passwords, OTP, PIN, Aadhaar numbers, and CAPTCHA), GovGuide automatically shows a secure protection notice:
  > *"This is a secure input field. GovGuide never reads, stores, or inspects your personal values."*

---

## 🏛️ Supported Portals & Verified Workflows

| Portal | Scope | Verified Screens | Guide File |
|---|---|---|---|
| **Parivahan Sarathi** | Ministry of Road Transport & Highways (Delhi) | State Selection, Contactless Modal, State Dashboard, LL Instructions, Applicant Category, Aadhaar eKYC, Stages Overview | `guides/parivahan/sarathi-ll.json` |
| **Passport Seva** | Ministry of External Affairs | Homepage Advisory Popup, Service Hub, Fee Calculator, Document Advisor, Locate PSK, Application Status, Registration, Login | `guides/passportseva/passportseva-main.json` |

---

## 🌐 Supported Languages & Review Process

GovGuide supports 11 Indian languages out of the box:
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

Languages marked with `reviewed: false` display an unobtrusive disclaimer badge in the speech bubble:
> *"Translation not yet checked by a native speaker"*.

---

## 🎙️ Voice Engine & Speech Quality

- **Calm Indian-English Female Voice:** Intelligent ranking prioritizes installed natural voices (e.g., Neerja, Heera, Veena, or Google India English) at a gentle 0.95x rate.
- **Conversational Spoken Scripts:** Spoken scripts are written in a warm, polite tone ("Okay, so...", "Just click...").
- **Speed & Mute Control:** Adjust speech rate (0.85x, 1.0x, 1.2x) or mute voice playback at any time.

---

## 🔒 Privacy & Safety Guarantees

- **No Network Requests:** The runtime extension makes **ZERO external API calls or network requests**.
- **No Keystroke or Input Reading:** GovGuide never attaches listeners that read citizen typed values.
- **Isolated Storage:** Stores only language/voice preferences, flow/page IDs, and document checklist tick states in `chrome.storage.local` / `chrome.storage.session`.
- **Shadow DOM Encapsulation:** All extension UI is isolated in `#govguide-root-host` so government site styles never leak into the companion and vice versa.
- **Permanent Disclaimer:** An independent helper badge is permanently visible on every screen.

---

## 📥 How to Install (Load Unpacked in Chrome)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/Darshaannn/GovtSathi.git
   ```
2. Open Google Chrome and enter `chrome://extensions` in the address bar.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `GvtSathi` folder containing `manifest.json`.

---

## 🚀 How to Run and Use It

### Option A: Built-in Offline Demo Portal
Open `chrome-extension://<EXTENSION_ID>/demo/demo.html` to experience all 5 expression states, quick-reply chips, and the document checklist in an offline sandbox.

### Option B: Live Portals
1. Navigate to **Parivahan Sarathi** (`https://sarathi.parivahan.gov.in`) or **Passport Seva** (`https://www.passportindia.gov.in`).
2. The companion will automatically mount, detect the page, point at the recommended action, and speak the step instruction.

---

## 🎮 Controls & On-Screen UI Guide

| Control | Icon | What It Does |
| :--- | :---: | :--- |
| **Language Toggle** | Dropdown | Switch between all 11 supported languages. |
| **Explain Field** | 🔍 | Toggle Explain-This-Field Mode ON/OFF. |
| **Text Size** | `aA` | Cycle between Small, Medium, and Large text sizes. |
| **Mute / Unmute** | 🔊 / 🔇 | Toggle voice reading on or off. |
| **Repeat Step** | 🔄 | Re-reads and re-speaks the current step instruction. |
| **Quick Chips** | ❓ / 📄 / 🆘 / ⏩ | Ask context questions or open the document checklist. |
| **Minimize** | `—` | Collapses the companion into a floating restore button. |
| **Next / Back** | Buttons | Manually navigate through steps. |
| **Drag** | Mouse / Touch | Drag the mascot anywhere on screen (position remembered). |

---

## 📂 Project File Structure

```text
GvtSathi/
├── manifest.json              # Chrome Extension MV3 manifest & permissions
├── assets/                    # Mascot assets & swappable configuration
│   ├── mascot-default.svg     # SVG character with 5 expression poses
│   └── mascot-config.js       # Appearance, dimensions & pointing offsets
├── engine/                    # Portal-agnostic core engine
│   ├── languages.js           # Central 11-language registry & UI strings
│   ├── shadow-dom.js          # Shadow DOM manager (#govguide-root-host) & themes
│   ├── highlighter.js         # Soft SVG spotlight overlay & pulse ring
│   ├── element-finder.js      # Robust multi-tier selector engine
│   ├── speech-service.js      # Web Speech API & voice ranking engine
│   ├── speech-bubble.js       # Speech bubble, quick-reply chips & checklist drawer
│   ├── mascot-ui.js           # Mascot DOM, drag persistence & 5 expression states
│   ├── step-runner.js         # State machine, DOM observer, chips & explain mode
│   └── content-script.js      # Bootstrapper matching URLs to guide JSONs
├── guides/                    # Pure declarative JSON guides
│   ├── registry.json          # Master directory of supported portals & URL patterns
│   ├── parivahan/             # Parivahan Sarathi driving licence guide
│   └── passportseva/          # Passport Seva citizen guide
├── popup/                     # Chrome Extension action popup & preferences
├── demo/                      # Standalone test & demonstration suite
├── tools/                     # Dev tools: offline test suites & audio generator
└── README.md                  # Comprehensive documentation
```

---

## ⚖️ Disclaimer

**Independent Civic Helper Project**: GovGuide is an independent, open-source educational project. It is **not affiliated with, endorsed by, or officially associated with the Government of India**, the Ministry of Road Transport and Highways (MoRTH), the Ministry of External Affairs (MEA), or any government department.
