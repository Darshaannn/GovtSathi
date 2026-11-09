# GovGuide (GvtSathi) - Indian Government Website Guide 🧭

> **A friendly visual guide and on-screen companion for citizens navigating complex Indian government portals.**

GovGuide is a privacy-first, lightweight Google Chrome extension (Manifest V3). When a citizen visits supported Indian government portals (such as **Parivahan Sarathi** for driving licences), GovGuide displays an on-screen mascot companion. The mascot moves across the page, shines an interactive spotlight ring on exactly what link, dropdown, or button to interact with, speaks instructions aloud in the user's chosen language (**English or Hindi**), and explains each step in simple, human words.

---

## 📑 Table of Contents
1. [Why This Project Exists](#-why-this-project-exists)
2. [Key Features](#-key-features)
3. [How It Works (Architecture)](#-how-it-works-architecture)
4. [Current Support & Verified Flows](#-current-support--verified-flows)
5. [Privacy & Safety Guarantees](#-privacy--safety-guarantees)
6. [How to Install (Load Unpacked in Chrome)](#-how-to-install-load-unpacked-in-chrome)
7. [How to Run and Use It](#-how-to-run-and-use-it)
   - [Option A: Try the Built-In Offline Demo Portal (Recommended first!)](#option-a-try-the-built-in-offline-demo-portal-recommended-first)
   - [Option B: Use on the Live Parivahan Portal](#option-b-use-on-the-live-parivahan-portal)
8. [Controls & On-Screen UI Guide](#-controls--on-screen-ui-guide)
9. [Project File Structure](#-project-file-structure)
10. [How to Add New Guides (For Contributors)](#-how-to-add-new-guides-for-contributors)
11. [Troubleshooting & FAQ](#-troubleshooting--faq)
12. [Disclaimer](#-disclaimer)

---

## 🎯 Why This Project Exists

Most government online portals are built with administrative terminology, nested dropdowns, and legacy layouts. While cyber-cafe operators and agents navigate them daily, ordinary citizens often find them confusing or intimidating:
- Which button starts a *new* application vs. a *renewal*?
- Why did a pop-up appear, and how do I dismiss it safely?
- What documents or preparation steps are actually required?

### What GovGuide Does:
- **Shows you where to go:** Highlights exact buttons, dropdowns, and cards with a glowing spotlight.
- **Speaks & Explains:** Uses Text-to-Speech (TTS) and speech bubbles in Hindi or English so anyone can follow along.
- **Never does the work for you:** You retain 100% control over typing, clicking, reviewing, and submitting.
- **Independent & Safe:** Zero reading of personal details, zero backend tracking, zero passwords or OTP interception.

---

## 🚀 Key Features

- 🛡️ **Encapsulated Shadow DOM**: The mascot, speech bubble, and spotlight are completely isolated inside a Shadow DOM (`#govguide-root-host`). The government page's CSS never distorts the mascot, and the mascot never breaks the website's design.
- 💡 **Non-Blocking Spotlight**: An SVG spotlight highlights the target element while keeping the element fully clickable through transparent cutouts (`pointer-events: none`).
- 🔄 **Multi-Tier Element Finder with Graceful Fallbacks**: Searches for elements using IDs, CSS selectors, visible text matching, or parent containers. If a website changes its HTML, GovGuide **never crashes**; it gracefully positions itself nearby and gives a helpful text description.
- 🗣️ **Bilingual Speech (Hindi & English)**:
  - English and Hindi voice explanations using the browser's native speech synthesis.
  - One-click instant language switching.
  - Replay button (🔄) to hear steps again; Mute button (🔊) for silent reading.
- 🎤 **Opt-In Voice Search**: Click the microphone button to say what you want (e.g. *"Learner Licence"* or *"लाइसेंस"*), and GovGuide will guide you there. (Strictly opt-in with full privacy consent).
- 🧭 **Draggable & Minimizable**: Drag the mascot anywhere on the screen if it covers content, or click minimize (`—`) to collapse it to a tiny pill.

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
│  │   │  - element-finder.js  - mascot-ui.js     │   │  │
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

1. **The Core Engine** (`/engine`): Generic, site-agnostic JavaScript. It handles DOM injection, speech, dragging, highlights, and step state progression. It has **no** hardcoded portal logic.
2. **Declarative Site Guides** (`/guides`): Pure JSON files defining URLs, matching rules, target selectors, and translations (English/Hindi). New guides can be created without touching any code!

---

## 📍 Current Support & Verified Flows

GovGuide currently includes complete, verified guidance for:

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

> **Note on other states:** Parivahan portal layouts vary slightly between states. Delhi is verified end-to-end; other states are currently untested.

---

## 🔒 Privacy & Safety Guarantees

GovGuide was engineered under strict zero-trust privacy constraints:

- ❌ **NEVER Reads Form Input Values**: The extension never inspects, reads, transmits, or stores values typed into form fields (such as Aadhaar numbers, mobile numbers, passwords, dates of birth, or addresses).
- ❌ **NO Network Calls**: The extension makes **zero** background HTTP requests to external analytics, servers, or tracking APIs. All logic and JSON guides run strictly inside your browser.
- ❌ **NO Auto-Submit or Bot Actions**: GovGuide never fills forms automatically, never clicks "Submit" on legal forms, and never bypasses CAPTCHA or OTP challenges.
- 🔒 **Minimal Permissions**: Uses only `storage` (to remember your language choice locally) and domain-specific content script injection.

---

## 📦 How to Install (Load Unpacked in Chrome)

You do **not** need to install anything from the Chrome Web Store. You can run GovGuide directly from source in developer mode:

### Step-by-Step Installation:
1. Open Google Chrome on your computer.
2. In the Chrome address bar, type:
   ```text
   chrome://extensions
   ```
   and press **Enter**.
3. In the top-right corner, toggle **Developer mode** to **ON** (switch should turn blue).
4. In the top-left corner, click the **Load unpacked** button.
5. In the folder browser dialog, select the project directory:
   ```text
   d:\Darshan\Coding\Mine\Projects\GvtSathi
   ```
   *(or whichever folder contains the `manifest.json` file)*.
6. Click **Select Folder**.
7. **Done!** You will now see **GovGuide - Indian Government Website Guide** in your extensions list.

> 💡 **Tip:** Click Chrome's jigsaw puzzle icon (Extensions) in the top right toolbar, find **GovGuide**, and click the **Pin** icon so it is always easily accessible.

---

## 🖥️ How to Run and Use It

### Option A: Try the Built-In Offline Demo Portal (Recommended first!)

You can test all GovGuide features immediately without needing internet access or visiting live government websites:

1. Click the **GovGuide** icon in your Chrome toolbar.
2. In the popup window, click the blue button: **"Open Test Portal"**.
3. *Alternative:* You can directly open this URL in a new tab:
   ```text
   chrome-extension://<EXTENSION_ID>/demo/demo.html
   ```
   *(Replace `<EXTENSION_ID>` with the ID shown on your `chrome://extensions` page for GovGuide).*
4. **What happens on the demo page:**
   - The GovGuide mascot appears in the bottom corner.
   - **Step 1:** Mascot moves toward the "Select State Name" dropdown and speaks the instructions. Select a state (e.g. *Delhi*).
   - **Step 2:** The guide advances and highlights the "Apply for Certificate" card. Click it.
   - **Step 3 (Resilience Test):** The guide tests an unfindable element. Notice that it does not crash—it shows a graceful explanation instead! Click **Next**.
   - **Step 4:** Mascot highlights the "Continue / Proceed" button.

---

### Option B: Use on the Live Parivahan Portal

1. Open Google Chrome.
2. Navigate to:
   ```text
   https://sarathi.parivahan.gov.in/
   ```
3. The page will redirect to the state selection screen.
4. **GovGuide will activate automatically:**
   - Mascot appears in the lower corner and highlights the state dropdown (`select#stfNameId`).
   - Select **Delhi**.
   - The contactless services modal will appear; GovGuide highlights the `x` close button.
   - Once closed, GovGuide highlights the **"Apply for Learner Licence"** service card.
   - Click it to view the instruction page where GovGuide highlights the **"Continue"** button.

---

## 🎮 Controls & On-Screen UI Guide

When the GovGuide mascot is active on a webpage, the interactive speech bubble provides the following controls:

| Control | Icon | What It Does |
| :--- | :---: | :--- |
| **Language Toggle** | Dropdown | Switch between **English** and **हिन्दी (Hindi)** instantly. Both text and voice adapt immediately. |
| **Mute / Unmute** | 🔊 / 🔇 | Toggle voice reading on or off. When muted, explanations appear only as text. |
| **Repeat Step** | 🔄 | Re-reads and re-speaks the current step instruction. |
| **Voice Search (Mic)** | 🎤 | Speak your goal (e.g., *"learner licence"*). Shows a clear one-time privacy consent notice on first use. |
| **Minimize** | `—` | Collapses the mascot into a small, unobtrusive floating pill in the corner. Click **Open GovGuide** to expand it again. |
| **Next / Prev** | ‹ / › | Manually navigate forward or backward through guide steps. |
| **Repositioning** | Mouse Drag | Click and hold anywhere on the mascot card to drag it to another area if it covers something important. |

---

## 📂 Project File Structure

```text
GvtSathi/
├── manifest.json              # Chrome Extension MV3 manifest & permissions
├── assets/                    # Mascot assets & swappable configuration
│   ├── mascot-default.svg     # Friendly SVG character with compass emblem
│   └── mascot-config.js       # Mascot appearance, dimensions & pointing offsets
├── engine/                    # Core Engine (strictly portal-agnostic)
│   ├── shadow-dom.js          # Shadow DOM manager (#govguide-root-host)
│   ├── highlighter.js         # SVG spotlight overlay with pointer-events: none
│   ├── element-finder.js      # Multi-tier selector engine (ID -> CSS -> Text -> Container)
│   ├── speech-service.js      # Web Speech API (TTS speech synthesis & opt-in STT)
│   ├── speech-bubble.js       # Dialogue box, action buttons, and language switcher
│   ├── mascot-ui.js           # Floating mascot DOM, dragging, and minimize behavior
│   ├── step-runner.js         # State machine, DOM observer & step progression
│   └── content-script.js      # Content script bootstrapper matching URLs to guides
├── guides/                    # Declarative Portal Guides (Pure JSON)
│   ├── registry.json          # Master directory of supported websites & URL patterns
│   └── parivahan/
│       └── sarathi-ll.json    # Verified Delhi Parivahan Learner's Licence guide
├── popup/                     # Chrome Extension Action Popup
│   ├── popup.html             # Popup layout with language selector & Demo link
│   ├── popup.css              # Clean GovGuide design styling
│   └── popup.js               # Reads/writes settings in chrome.storage.local
├── demo/                      # Standalone Test & Demo Suite
│   ├── demo.html              # Mock government portal harness
│   ├── demo.css               # Portal styling
│   └── demo-guide.json        # Test workflow guide
├── icons/                     # Extension branding icons (16, 48, 128 px)
└── README.md                  # Complete documentation (this file)
```

---

## 🛠️ How to Add New Guides (For Contributors)

Adding guidance for a new government portal requires **no coding** in the engine. You only need to create a JSON file:

1. **Register the Portal in [`guides/registry.json`](guides/registry.json):**
   ```json
   {
     "id": "epfo-uan-activation",
     "name": "EPFO - UAN Activation",
     "guidePath": "guides/epfo/uan-activation.json",
     "urlPatterns": ["*://unifiedportal-mem.epfindia.gov.in/*"]
   }
   ```

2. **Create the Guide JSON (`guides/epfo/uan-activation.json`):**
   Define pages, steps, target elements, and messages in both English and Hindi:
   ```json
   {
     "id": "epfo-uan-activation",
     "defaultLanguage": "en",
     "supportedLanguages": ["en", "hi"],
     "flows": [
       {
         "flowId": "activate_uan",
         "name": { "en": "Activate UAN", "hi": "यूएएन सक्रिय करें" },
         "pages": [
           {
             "pageId": "home_page",
             "match": {
               "urlRegex": "unifiedportal-mem\\.epfindia\\.gov\\.in.*",
               "pageTitle": "Member Home"
             },
             "steps": [
               {
                 "stepId": "step_click_activate",
                 "order": 1,
                 "actionType": "point_and_click",
                 "target": {
                   "css": "a[href*='activateUan']",
                   "textMatch": "Activate UAN"
                 },
                 "messages": {
                   "en": {
                     "bubble": "Click on 'Activate UAN' in the Important Links box.",
                     "speech": "Click on Activate UAN to proceed."
                   },
                   "hi": {
                     "bubble": "'Important Links' बॉक्स में 'Activate UAN' पर क्लिक करें।",
                     "speech": "आगे बढ़ने के लिए Activate UAN पर क्लिक करें।"
                   }
                 },
                 "stepDoneTrigger": { "type": "click", "selector": "a[href*='activateUan']" },
                 "fallback": {
                   "en": "Look for the link titled 'Activate UAN' on the right side.",
                   "hi": "दाईं ओर 'Activate UAN' नाम का लिंक देखें।"
                 }
               }
             ]
           }
         ]
       }
     ]
   }
   ```

---

## ❓ Troubleshooting & FAQ

### 1. I loaded the extension, but the mascot doesn't appear on the page.
- Make sure the URL you are visiting matches a supported pattern in [`guides/registry.json`](guides/registry.json).
- If testing locally, open the built-in demo page: `chrome-extension://<EXTENSION_ID>/demo/demo.html`.
- Open Chrome DevTools (`F12` &rarr; `Console`) and check for messages prefixed with `[GovGuide]`.

### 2. Can the extension hear me or record my microphone?
- **No.** The microphone is completely off by default. It is only activated for 8 seconds when you explicitly click the 🎤 button. Speech synthesis (speaking aloud) is processed locally on your machine.

### 3. Does GovGuide store my Aadhaar number or phone number?
- **Never.** GovGuide does not read the `.value` property of any input elements on the page. Its listeners only detect *that* a button was clicked or a dropdown was changed to advance the guide step.

---

## ⚖️ Disclaimer

**Independent Civic Helper Project**: GovGuide is an independent, open-source educational project. It is **not affiliated with, endorsed by, or officially associated with the Government of India**, the Ministry of Road Transport and Highways (MoRTH), NIC, or any state government department. All government portal names, trademarks, and logos belong to their respective authorities.
