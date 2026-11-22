# Contributing to GovGuide

Thank you for your interest in improving GovGuide! We welcome contributions to make Indian government portals more accessible to all citizens.

---

## 🔒 Crucial Privacy Rule for All Contributors

> **IMPORTANT: NEVER SUBMIT PERSONAL DATA**  
> Never commit or attach screenshots, HTML captures, HAR files, or test logs that contain real personal data (e.g. real names, dates of birth, phone numbers, Aadhaar numbers, vehicle registration numbers, application file numbers, passwords, or OTPs).  
> All PRs containing real personal data will be rejected immediately.

---

## 🗣️ Native Speakers Wanted!

Currently, 9 out of our 11 supported languages are machine translations flagged as `reviewed: false`. If you speak Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, or Odia, we would love your help reviewing phrases to ensure they sound warm, polite, and natural.

See the [Language Guide](docs/adding-a-language.md) for details on reviewing.

---

## 🛠️ How to Contribute

1. **Review a Translation**: Check guide text in `guides/` and change `reviewed: true` in `engine/languages.js`.
2. **Report a Broken Guide**: When a government portal changes its layout, open a [Guide Broken Report](.github/ISSUE_TEMPLATE/guide-broke.yml).
3. **Add a New Portal Guide**: Follow the [Guide Authoring Spec](docs/writing-a-guide.md).
4. **Improve the Engine or Mascot**: See [Mascot Documentation](docs/mascot.md) and [Architecture](docs/architecture.md).

---

## 🧪 Testing Your Changes

Before submitting a Pull Request, run the offline verification test suite:

```bash
node tools/test-interactive-suite.js
```

Ensure:
- 0 form input value reads (`.value`).
- 0 external network requests from extension runtime.
- All pages across Sarathi and Passport Seva pass schema verification.
