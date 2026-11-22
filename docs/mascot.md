# Mascot Specification & Customization

The GovGuide companion mascot is swappable via `assets/mascot-config.js` without touching engine code.

---

## 1. Mascot Requirements

The placeholder mascot (`assets/mascot-default.svg`) is a friendly owl/bird companion designed to provide visual reassurance to citizens navigating bureaucratic forms.

A production or custom mascot must support **5 distinct expression poses**:

| Expression | Required Pose / Emotion | Used When |
|---|---|---|
| **`idle`** | Neutral resting pose, gentle sinusoidal floating bob | Default resting state; between steps |
| **`pointing`** | Dynamic forward stance, wing or hand pointing at target element | Target button or dropdown is highlighted |
| **`thinking`** | Upward gaze, head tilt, optional lightbulb or sparkle accessory | Explain-This-Field active, "I'm stuck" chip, or 20s inactivity |
| **`happy`** | Cheerful celebration bounce, smiling curved eyes, open beak/mouth | On step completion / user progress (1.8s) |
| **`confused`** | Puzzled head tilt, quizzical eyebrow, question mark indicator | Target element missing, fallback notice active |

---

## 2. Configuration (`assets/mascot-config.js`)

```javascript
const MascotConfig = {
  type: 'svg', // 'svg' | 'image'
  assetPath: 'assets/mascot-default.svg',
  defaultWidth: 90,
  defaultHeight: 90,
  name: 'Sathi',
  pointingHandOffset: {
    x: 45,
    y: -10
  }
};
```

---

## 3. Shadow DOM Scoping

The mascot is rendered inside an open Shadow Root (`#govguide-root-host`). This ensures:
- Mascot SVG CSS never bleeds into government portal forms.
- Government website stylesheets (like Bootstrap, jQuery UI, or NIC portal themes) never break mascot positioning, floating animations, or speech bubbles.
- Position is draggable by citizens and persisted across page loads via `chrome.storage.local`.
