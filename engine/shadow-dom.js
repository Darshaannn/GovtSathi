/**
 * GovGuide - Shadow DOM Encapsulator
 * Isolates extension mascot and UI from target page CSS, and prevents extension styles leaking out.
 * Supports:
 * - Rounded soft-shadow modern speech bubble with directional tail
 * - System Light / Dark mode
 * - Text size modes: small (13px), medium (15px), large (17px)
 * - Quick-Reply chips bar and expandable Document Checklist drawer
 * - "What's Next" preview drawer with trust badges and verified source links
 * - Explain-This-Field active mode styling
 * - Mascot expressions: idle, pointing, thinking, happy, confused
 * - Accessibility: visible focus ring, min 44px touch targets, aria support
 * - prefers-reduced-motion compliance
 * - Non-blocking spotlight & pulsating target ring
 */
(function() {
  const HOST_ID = 'govguide-root-host';

  class ShadowDomManager {
    constructor() {
      this.hostElement = null;
      this.shadowRoot = null;
    }

    init() {
      if (document.getElementById(HOST_ID)) {
        this.hostElement = document.getElementById(HOST_ID);
        this.shadowRoot = this.hostElement.shadowRoot;
        return this.shadowRoot;
      }

      this.hostElement = document.createElement('div');
      this.hostElement.id = HOST_ID;
      // Host container spans full screen with no pointer events so clicks fall through
      Object.assign(this.hostElement.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '2147483640',
        pointerEvents: 'none',
        overflow: 'hidden'
      });

      this.shadowRoot = this.hostElement.attachShadow({ mode: 'open' });
      this._injectBaseStyles();

      document.body.appendChild(this.hostElement);
      return this.shadowRoot;
    }

    _injectBaseStyles() {
      const style = document.createElement('style');
      style.textContent = `
        :host {
          all: initial;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", "Nirmala UI", "Mangal", "Arial Unicode MS", sans-serif;
          font-size: 15px;
          line-height: 1.5;
          box-sizing: border-box;

          /* Light Theme Variables */
          --gg-bg: #ffffff;
          --gg-surface: #f8fafc;
          --gg-surface-hover: #f1f5f9;
          --gg-border: rgba(226, 232, 240, 0.9);
          --gg-text-primary: #0f172a;
          --gg-text-secondary: #475569;
          --gg-text-muted: #64748b;
          --gg-primary: #2563eb;
          --gg-primary-hover: #1d4ed8;
          --gg-primary-text: #ffffff;
          --gg-accent: #0284c7;
          --gg-ring: #2563eb;
          --gg-shadow-lg: 0 16px 36px -4px rgba(15, 23, 42, 0.16), 0 6px 16px -2px rgba(15, 23, 42, 0.08);
          --gg-shadow-md: 0 6px 18px -2px rgba(15, 23, 42, 0.12);
          --gg-focus-outline: 3px solid #60a5fa;
          --gg-badge-bg: rgba(15, 23, 42, 0.92);
          --gg-badge-text: #f8fafc;
          --gg-spotlight-dim: rgba(15, 23, 42, 0.45);
          --gg-tail-border: rgba(226, 232, 240, 0.9);

          /* Trust Badge Colors */
          --gg-trust-verified-bg: #dcfce7;
          --gg-trust-verified-text: #166534;
          --gg-trust-official-bg: #e0f2fe;
          --gg-trust-official-text: #075985;
          --gg-trust-unverified-bg: #fef3c7;
          --gg-trust-unverified-text: #92400e;
        }

        /* Dark Theme Support via System Setting */
        @media (prefers-color-scheme: dark) {
          :host {
            --gg-bg: #1e293b;
            --gg-surface: #0f172a;
            --gg-surface-hover: #334155;
            --gg-border: rgba(71, 85, 105, 0.7);
            --gg-text-primary: #f8fafc;
            --gg-text-secondary: #cbd5e1;
            --gg-text-muted: #94a3b8;
            --gg-primary: #3b82f6;
            --gg-primary-hover: #60a5fa;
            --gg-primary-text: #ffffff;
            --gg-accent: #38bdf8;
            --gg-ring: #60a5fa;
            --gg-shadow-lg: 0 18px 40px -4px rgba(0, 0, 0, 0.45), 0 8px 18px -2px rgba(0, 0, 0, 0.35);
            --gg-shadow-md: 0 8px 20px -2px rgba(0, 0, 0, 0.35);
            --gg-focus-outline: 3px solid #93c5fd;
            --gg-badge-bg: rgba(30, 41, 59, 0.95);
            --gg-badge-text: #f8fafc;
            --gg-spotlight-dim: rgba(0, 0, 0, 0.65);
            --gg-tail-border: rgba(71, 85, 105, 0.7);

            /* Trust Badge Colors Dark */
            --gg-trust-verified-bg: #064e3b;
            --gg-trust-verified-text: #a7f3d0;
            --gg-trust-official-bg: #0c4a6e;
            --gg-trust-official-text: #bae6fd;
            --gg-trust-unverified-bg: #78350f;
            --gg-trust-unverified-text: #fde68a;
          }
        }

        *, *::before, *::after {
          box-sizing: inherit;
        }

        /* Focus rings for keyboard navigation */
        button:focus-visible, select:focus-visible, a:focus-visible, input:focus-visible {
          outline: var(--gg-focus-outline);
          outline-offset: 2px;
        }

        /* Independent helper badge (always visible) */
        .govguide-disclaimer-badge {
          position: fixed;
          bottom: 12px;
          left: 14px;
          background: var(--gg-badge-bg);
          color: var(--gg-badge-text);
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.3px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 7px;
          user-select: none;
          z-index: 2147483645;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .govguide-disclaimer-badge .dot {
          width: 7px;
          height: 7px;
          background-color: #38bdf8;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 8px #38bdf8;
        }

        /* Spotlight Cutout Overlay */
        .govguide-spotlight-svg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 2147483641;
          transition: opacity 0.35s ease-out;
        }

        /* Animated Pulse Ring around Target */
        .govguide-target-ring {
          position: absolute;
          border: 3px solid var(--gg-ring);
          border-radius: 10px;
          pointer-events: none;
          z-index: 2147483642;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25), 0 0 24px rgba(37, 99, 235, 0.45);
          transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
          animation: govguide-pulse 2s infinite ease-in-out;
        }

        @keyframes govguide-pulse {
          0% { box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35), 0 0 16px rgba(37, 99, 235, 0.35); }
          50% { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.12), 0 0 32px rgba(37, 99, 235, 0.55); }
          100% { box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35), 0 0 16px rgba(37, 99, 235, 0.35); }
        }

        /* Mascot Container */
        .govguide-mascot-container {
          position: fixed;
          width: 90px;
          height: 90px;
          z-index: 2147483644;
          pointer-events: auto;
          cursor: grab;
          transition: left 0.45s cubic-bezier(0.25, 1, 0.5, 1), top 0.45s cubic-bezier(0.25, 1, 0.5, 1), transform 0.35s ease;
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.22));
          user-select: none;
        }

        .govguide-mascot-container:active {
          cursor: grabbing;
        }

        .govguide-mascot-container.idle-bobbing {
          animation: govguide-idle 3.5s ease-in-out infinite;
        }

        .govguide-mascot-container.is-speaking {
          animation: govguide-speaking 0.6s ease-in-out infinite alternate;
        }

        /* Mascot Expression States */
        .govguide-mascot-container.expression-idle {
          transform: rotate(0deg) scale(1);
        }

        .govguide-mascot-container.expression-pointing {
          transform: rotate(-3deg) scale(1.03);
        }

        .govguide-mascot-container.expression-thinking {
          animation: govguide-thinking 2.5s ease-in-out infinite;
        }

        .govguide-mascot-container.expression-happy {
          animation: govguide-celebrate 0.6s ease-in-out 3 alternate;
        }

        .govguide-mascot-container.expression-confused {
          transform: rotate(7deg) scale(0.98);
          animation: govguide-confused 1.8s ease-in-out infinite alternate;
        }

        @keyframes govguide-idle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(1.2deg); }
        }

        @keyframes govguide-speaking {
          0% { transform: scale(1) translateY(0); }
          100% { transform: scale(1.05) translateY(-4px); }
        }

        @keyframes govguide-thinking {
          0%, 100% { transform: translateY(-3px) rotate(2deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
        }

        @keyframes govguide-celebrate {
          0% { transform: translateY(0) scale(1) rotate(0deg); }
          50% { transform: translateY(-16px) scale(1.12) rotate(4deg); }
          100% { transform: translateY(-6px) scale(1.08) rotate(-4deg); }
        }

        @keyframes govguide-confused {
          0% { transform: rotate(5deg) translateY(0); }
          100% { transform: rotate(9deg) translateY(-4px); }
        }

        .govguide-mascot-img {
          width: 100%;
          height: 100%;
          display: block;
        }

        /* Modern Speech Bubble */
        .govguide-speech-bubble {
          position: fixed;
          width: 360px;
          max-width: calc(100vw - 24px);
          background: var(--gg-bg);
          color: var(--gg-text-primary);
          border-radius: 18px;
          box-shadow: var(--gg-shadow-lg);
          padding: 16px 18px;
          z-index: 2147483644;
          pointer-events: auto;
          transition: left 0.35s cubic-bezier(0.25, 1, 0.5, 1), top 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.25s ease;
          border: 1px solid var(--gg-border);
        }

        /* Speech Bubble Tail */
        .govguide-bubble-tail {
          position: absolute;
          width: 14px;
          height: 14px;
          background: var(--gg-bg);
          border: 1px solid var(--gg-tail-border);
          transform: rotate(45deg);
          pointer-events: none;
        }

        .govguide-bubble-tail.tail-left {
          left: -7px;
          top: 36px;
          border-right: none;
          border-top: none;
        }

        .govguide-bubble-tail.tail-right {
          right: -7px;
          top: 36px;
          border-left: none;
          border-bottom: none;
        }

        .govguide-bubble-tail.tail-top {
          top: -7px;
          left: 48px;
          border-right: none;
          border-bottom: none;
        }

        .govguide-bubble-tail.tail-bottom {
          bottom: -7px;
          left: 48px;
          border-left: none;
          border-top: none;
        }

        .govguide-bubble-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--gg-border);
          padding-bottom: 8px;
          margin-bottom: 10px;
          gap: 6px;
        }

        .govguide-bubble-title {
          font-weight: 700;
          font-size: 13.5px;
          color: var(--gg-primary);
          display: flex;
          align-items: center;
          gap: 6px;
          letter-spacing: -0.2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .govguide-bubble-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        /* Control Buttons with min 38-44px touch targets */
        .govguide-icon-btn {
          background: var(--gg-surface);
          border: 1px solid var(--gg-border);
          border-radius: 8px;
          min-width: 38px;
          min-height: 38px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--gg-text-secondary);
          font-size: 15px;
          padding: 0;
          transition: all 0.15s ease;
        }

        .govguide-icon-btn:hover {
          background: var(--gg-surface-hover);
          color: var(--gg-text-primary);
          border-color: var(--gg-primary);
        }

        .govguide-icon-btn.active {
          background: #ef4444;
          color: #ffffff;
          border-color: #dc2626;
          animation: govguide-rec-pulse 1.2s infinite;
        }

        .govguide-icon-btn.mode-active {
          background: var(--gg-primary);
          color: #ffffff;
          border-color: var(--gg-primary-hover);
        }

        @keyframes govguide-rec-pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        /* Text Size Variants */
        .govguide-speech-bubble.text-size-small .govguide-bubble-body {
          font-size: 13.5px;
          line-height: 1.45;
        }
        .govguide-speech-bubble.text-size-medium .govguide-bubble-body {
          font-size: 15px;
          line-height: 1.55;
        }
        .govguide-speech-bubble.text-size-large .govguide-bubble-body {
          font-size: 17.5px;
          line-height: 1.6;
        }

        .govguide-bubble-body {
          color: var(--gg-text-primary);
          margin-bottom: 10px;
          min-height: 44px;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        /* Quick-Reply Chips Bar */
        .govguide-chips-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
          padding-top: 6px;
          border-top: 1px dashed var(--gg-border);
        }

        .govguide-chip {
          background: var(--gg-surface);
          border: 1px solid var(--gg-border);
          color: var(--gg-text-secondary);
          border-radius: 9999px;
          padding: 5px 11px;
          font-size: 11.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          min-height: 28px;
        }

        .govguide-chip:hover {
          background: var(--gg-surface-hover);
          color: var(--gg-primary);
          border-color: var(--gg-primary);
          transform: translateY(-1px);
        }

        .govguide-chip:active {
          transform: translateY(0);
        }

        /* Document Checklist Drawer */
        .govguide-checklist-drawer {
          background: var(--gg-surface);
          border: 1px solid var(--gg-border);
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 12px;
          font-size: 12.5px;
        }

        .govguide-checklist-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 600;
          color: var(--gg-text-primary);
          margin-bottom: 6px;
        }

        .govguide-checklist-items {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 140px;
          overflow-y: auto;
        }

        .govguide-checklist-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
          color: var(--gg-text-secondary);
        }

        .govguide-checklist-item input[type="checkbox"] {
          margin-top: 3px;
          cursor: pointer;
          accent-color: var(--gg-primary);
          width: 15px;
          height: 15px;
        }

        .govguide-checklist-item.checked span {
          text-decoration: line-through;
          color: var(--gg-text-muted);
        }

        /* "What's Next" Preview Drawer */
        .govguide-whats-next-drawer {
          background: var(--gg-surface);
          border: 1px solid var(--gg-border);
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 12px;
          font-size: 12.5px;
        }

        .govguide-whats-next-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 600;
          color: var(--gg-text-primary);
          margin-bottom: 8px;
        }

        .govguide-whats-next-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 220px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .govguide-whats-next-item {
          background: var(--gg-bg);
          border: 1px solid var(--gg-border);
          border-radius: 8px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .govguide-whats-next-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          flex-wrap: wrap;
        }

        .govguide-whats-next-title {
          font-weight: 600;
          color: var(--gg-text-primary);
          font-size: 12.5px;
        }

        .govguide-trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 9999px;
          white-space: nowrap;
        }

        .govguide-trust-badge.trust-verified_page {
          background: var(--gg-trust-verified-bg);
          color: var(--gg-trust-verified-text);
        }

        .govguide-trust-badge.trust-official_document {
          background: var(--gg-trust-official-bg);
          color: var(--gg-trust-official-text);
        }

        .govguide-trust-badge.trust-unverified {
          background: var(--gg-trust-unverified-bg);
          color: var(--gg-trust-unverified-text);
        }

        .govguide-whats-next-desc {
          color: var(--gg-text-secondary);
          line-height: 1.4;
          font-size: 12px;
        }

        .govguide-whats-next-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--gg-text-muted);
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px dashed var(--gg-border);
          flex-wrap: wrap;
          gap: 4px;
        }

        .govguide-whats-next-meta a {
          color: var(--gg-primary);
          text-decoration: underline;
          cursor: pointer;
        }

        .govguide-whats-next-meta a:hover {
          color: var(--gg-primary-hover);
        }

        .govguide-stale-warning {
          color: #b45309;
          font-size: 10.5px;
          display: block;
          margin-top: 2px;
        }

        .govguide-unverified-warning {
          color: #b45309;
          font-size: 10.5px;
          display: block;
          margin-top: 2px;
        }

        /* Review warning note */
        .govguide-unreviewed-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fffbeb;
          border: 1px solid #fef3c7;
          color: #92400e;
          padding: 5px 8px;
          border-radius: 6px;
          font-size: 11px;
          margin-bottom: 10px;
          line-height: 1.35;
        }

        @media (prefers-color-scheme: dark) {
          .govguide-unreviewed-pill {
            background: #451a03;
            border-color: #78350f;
            color: #fde68a;
          }
        }

        .govguide-notice-box {
          font-size: 12px;
          background: rgba(37, 99, 235, 0.08);
          border-left: 3px solid var(--gg-primary);
          padding: 8px 10px;
          border-radius: 6px;
          margin-bottom: 12px;
          color: var(--gg-text-primary);
        }

        .govguide-bubble-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid var(--gg-border);
          gap: 8px;
        }

        /* Step Progress Indicator (e.g. "Step 2 of 5") */
        .govguide-step-progress {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .govguide-step-counter {
          font-size: 12.5px;
          color: var(--gg-text-muted);
          font-weight: 600;
        }

        .govguide-footer-btns {
          display: flex;
          gap: 8px;
        }

        .govguide-btn {
          background: var(--gg-primary);
          color: var(--gg-primary-text);
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          min-height: 40px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .govguide-btn:hover {
          background: var(--gg-primary-hover);
        }

        .govguide-btn:active {
          transform: scale(0.98);
        }

        .govguide-btn-secondary {
          background: var(--gg-surface);
          color: var(--gg-text-primary);
          border: 1px solid var(--gg-border);
        }

        .govguide-btn-secondary:hover {
          background: var(--gg-surface-hover);
        }

        /* Language Picker */
        .govguide-lang-select {
          background: var(--gg-surface);
          border: 1px solid var(--gg-border);
          border-radius: 8px;
          min-height: 38px;
          height: 38px;
          padding: 4px 6px;
          font-size: 12px;
          color: var(--gg-text-primary);
          font-weight: 600;
          cursor: pointer;
          max-width: 82px;
        }

        /* Floating Restore Pill */
        .govguide-restore-pill {
          position: fixed;
          bottom: 44px;
          right: 20px;
          background: var(--gg-primary);
          color: var(--gg-primary-text);
          padding: 10px 18px;
          min-height: 44px;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 13.5px;
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.45);
          cursor: pointer;
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 2147483645;
          transition: transform 0.2s ease, background 0.15s ease;
        }

        .govguide-restore-pill:hover {
          transform: translateY(-2px);
          background: var(--gg-primary-hover);
        }

        /* Accessibility: Respect prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
          .govguide-mascot-container.idle-bobbing,
          .govguide-mascot-container.is-speaking,
          .govguide-mascot-container.expression-thinking,
          .govguide-mascot-container.expression-happy,
          .govguide-mascot-container.expression-confused,
          .govguide-target-ring {
            animation: none !important;
          }
        }
      `;
      this.shadowRoot.appendChild(style);

      // Add always-visible disclaimer
      const disclaimer = document.createElement('div');
      disclaimer.className = 'govguide-disclaimer-badge';
      disclaimer.innerHTML = '<span class="dot"></span> Not a government product / Independent helper';
      this.shadowRoot.appendChild(disclaimer);
    }
  }

  window.GovGuideShadowManager = ShadowDomManager;
})();
