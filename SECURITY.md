# Security Policy

## 1. Reporting Security or Privacy Issues

We take citizen privacy and software security seriously. Because this extension is designed to assist users on government portals, maintaining zero-leakage boundaries is essential.

If you believe you have found a security vulnerability or privacy flaw (such as an unintentional form value read, memory leak, or style injection issue):

**Please DO NOT open a public GitHub issue.**

Instead, report it privately to the project maintainers:

- **Security Contact**: `[SECURITY CONTACT EMAIL: TODO - OWNER TO FILL]`
- **Response Window**: You will receive an acknowledgment within 48 hours.

Please include:
1. Steps to reproduce the issue.
2. The URL of the page where the issue occurs.
3. Screenshots or network logs (ensure NO real citizen personal data, Aadhaar, password, or OTP is shown).

---

## 2. Hard Security Rules Enforced in Code

1. **Zero Input Reading**: Code is audited to ensure `element.value` is never read from citizen form inputs.
2. **Zero External Calls**: Extension makes no network calls to external analytics or APIs at runtime.
3. **Shadow DOM Isolation**: Mascot and bubble UI mount inside an isolated Shadow Root to prevent CSS/DOM collision with government web pages.
