# Adding or Reviewing a Language

GovGuide supports 11 Indian languages. We actively invite native speakers to review translations and add new languages.

---

## 1. Supported Languages Status

| Language | Code | Native Name | Status |
|---|---|---|---|
| English | `en` | English | Reviewed ✅ |
| Hindi | `hi` | हिन्दी | Reviewed ✅ |
| Marathi | `mr` | मराठी | Not yet reviewed ⚠️ |
| Gujarati | `gu` | ગુજરાતી | Not yet reviewed ⚠️ |
| Bengali | `bn` | বাংলা | Not yet reviewed ⚠️ |
| Tamil | `ta` | தமிழ் | Not yet reviewed ⚠️ |
| Telugu | `te` | తెలుగు | Not yet reviewed ⚠️ |
| Kannada | `kn` | ಕನ್ನಡ | Not yet reviewed ⚠️ |
| Malayalam | `ml` | മലയാളം | Not yet reviewed ⚠️ |
| Punjabi | `pa` | ਪੰਜਾਬੀ | Not yet reviewed ⚠️ |
| Odia | `or` | ଓଡ଼ିଆ | Not yet reviewed ⚠️ |

---

## 2. Reviewing an Existing Translation

If you speak one of the 9 unreviewed languages:
1. Open the guide JSON you wish to review (e.g. `guides/parivahan/sarathi-ll.json`).
2. Verify that sentences read naturally in conversational phrasing.
3. **Keep official government terms in English** where helpful (e.g., *"Apply for Learner Licence"* or *"Continue"*), so citizens can visually match what is written on the portal button.
4. Once verified, update the flag in `engine/languages.js`:
   ```javascript
   {
     code: 'mr',
     englishName: 'Marathi',
     nativeName: 'मराठी',
     ttsLocale: 'mr-IN',
     direction: 'ltr',
     reviewed: true // Change to true
   }
   ```
5. Submit a pull request.

---

## 3. Adding a Completely New Language

1. Register the language in `engine/languages.js`:
   Add entry to `LANGUAGES` array with code, English name, native name, and speech locale.
2. Add UI string translations in `engine/languages.js` under `UI_STRINGS` for all buttons, notices, and chip labels.
3. Add translations for steps in guide JSON files.
4. Add the language option to `popup/popup.html`.
