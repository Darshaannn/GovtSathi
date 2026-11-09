# TEST PHASE 2: Passport Seva Live Read-Only Run

**Execution Date**: 2026-11-09T07:03:11.869Z
**Domain Tested**: `https://www.passportindia.gov.in/psp`
**Bypass CSP**: Enabled (simulates Chrome Extension Content Script Isolated World execution)

### 01-homepage
```json
{
  "matchedPage": "screen_02_homepage_hub",
  "stepId": "step_02_overview_services",
  "targetFound": true,
  "targetSelector": "#collasible-nav-dropdown3, a.dropdown-toggle[title='Services']",
  "hostsCount": 1,
  "bubbleTitle": "Explore Passport Services & Apply",
  "bubbleMessage": null,
  "disclaimerPresent": true
}
```

### 02-fee-calculator
```json
{
  "matchedPage": "screen_03_fee_calculator",
  "stepId": "step_05_select_fee_application_type",
  "targetFound": true,
  "targetSelector": "select.locatePskBoxShape1, select",
  "hostsCount": 1,
  "bubbleTitle": "Explore Passport Services & Apply",
  "bubbleMessage": null,
  "disclaimerPresent": true
}
```

### 03-locate-psk
```json
{
  "matchedPage": "screen_05_locate_psk",
  "stepId": "step_07_select_psk_office",
  "targetFound": true,
  "targetSelector": "select.locatePskBoxShape, select",
  "hostsCount": 1,
  "bubbleTitle": "Explore Passport Services & Apply",
  "bubbleMessage": null,
  "disclaimerPresent": true
}
```

### 04-track-status
```json
{
  "matchedPage": "screen_06_track_status",
  "stepId": "step_08_explain_status_tracking",
  "targetFound": true,
  "targetSelector": "input#formBasicEmail, input[placeholder*='file number']",
  "hostsCount": 1,
  "bubbleTitle": "Explore Passport Services & Apply",
  "bubbleMessage": null,
  "disclaimerPresent": true
}
```

### 05-language-switch-hindi
```json
{
  "lang": "hi"
}
```

## Safety Compliance
- **Zero form typing**: Did not type any mock details, file numbers, or dates of birth.
- **Zero form submission**: No forms or fees submitted.
- **No CAPTCHA / OTP bypass**: Preserved all official boundaries.
