# Diagnosis & Analysis Report (GovGuide Delhi LL Flow)

## 1. Captured Pages vs. Guide Match Rules

| Capture ID & File | Actual Live URL | Document Title | Guide `match.urlRegex` & `pageTitle` | Evaluation & Discrepancies |
| :--- | :--- | :--- | :--- | :--- |
| **01-state-selection**<br>`01-state-selection.html` | `https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do` | `Home` | `sarathi\.parivahan\.gov\.in/sarathiservice/(stateSelection\.do)?(\?.*)?$`<br>`pageTitle: "Home"` | **Matches**. Also includes `elementPresence: "select#stfNameId, select[name='stName']"`. |
| **02-contactless-modal**<br>`02-contactless-modal.html` | `https://sarathi.parivahan.gov.in/sarathiservice/stateSelectBean.do` | `Home` | `sarathi\.parivahan\.gov\.in/sarathiservice/stateSelectBean\.do.*`<br>`pageTitle: "Home"` | **URL & Title overlap with Screen 03**. Requires modal DOM selector: `elementPresence: "#contactless_statepopup.in, #contactless_statepopup[style*='display: block'], #contactless_statepopup button.close"`. |
| **03-state-dashboard**<br>`03-state-dashboard.html` | `https://sarathi.parivahan.gov.in/sarathiservice/stateSelectBean.do` | `Home` | `sarathi\.parivahan\.gov\.in/sarathiservice/stateSelectBean\.do.*`<br>`pageTitle: "Home"` | **URL & Title overlap with Screen 02**. Disambiguated by: `elementPresence: "a[href='newLLDet.do'], a.dropdown-item[href='newLLDet.do']"` when modal is dismissed. |
| **04-instructions-page**<br>`04-instructions-page.html` | `https://sarathi.parivahan.gov.in/sarathiservice/newLLDet.do` | `New LL Stage Details` | `sarathi\.parivahan\.gov\.in/sarathiservice/newLLDet\.do.*`<br>`pageTitle: "New LL Stage Details"` | **Matches**. Disambiguated by `elementPresence: "input[value='Continue'], input[onclick*='newLL_displayNewLL.do']"`. |
| **05-applicant-category**<br>`05-applicant-category.html` | `https://sarathi.parivahan.gov.in/sarathiservice/newLL_displayNewLL.do` | `New Licence` | `sarathi\.parivahan\.gov\.in/sarathiservice/newLL_displayNewLL\.do.*`<br>`pageTitle: "New Licence"` | **Matches**. Disambiguated by `elementPresence: "form#newLL_execute, input#submitOfNewLL"`. |

## 2. Engine Current Page Selection Mechanism
- Previously, `StepRunner._init()` called `setFlow(this.guide.flows[0])`, which unconditionally hardcoded `this.currentPage = flow.pages[0]` (the state selection page).
- When a user navigated to a subsequent screen (e.g. `stateSelectBean.do`, `newLLDet.do`, or `newLL_displayNewLL.do`), the engine never evaluated which page matched the URL or DOM. It continued attempting to execute steps from Page 0, resulting in failure to guide screens 02 through 05.
- Fix requirement:
  - On page load, `detectAndApplyPage()` evaluates all pages in `currentFlow.pages` against URL regex, document title, and `elementPresence`.
  - On significant structural DOM mutations (e.g. modal appearing or closing), a throttled `MutationObserver` triggers `detectAndApplyPage()`.
  - Session progress tracks `{ flowId, pageId }` in `chrome.storage.session` without touching any form field values.

## 3. Iframe Inspection Findings
- Captured HTML inspection showed:
  - `02-contactless-modal.html`: `<iframe src="authenticationaction.do">` and `<iframe id="ifz">`
  - `03-state-dashboard.html`: `<iframe src="authenticationaction.do">` and `<iframe id="ifz">`
  - `04-instructions-page.html`: `<iframe id="ifz">`
  - `05-applicant-category.html`: `<iframe id="ifz">`
- These iframes are hidden utility / modal PDF or test frames. The primary form and navigation interactive elements reside in the top frame.
- Requirement: `manifest.json` content script specifies `all_frames: true`, while `content-script.js` explicitly checks `if (window !== window.top) return;` so the mascot mounts strictly in the top frame.

