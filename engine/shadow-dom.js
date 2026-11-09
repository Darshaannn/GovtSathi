/**
 * GovGuide - Shadow DOM Encapsulator
 * Isolates extension mascot and UI from target page CSS, and prevents extension styles leaking out.
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
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #1e293b;
          box-sizing: border-box;
        }

        *, *::before, *::after {
          box-sizing: inherit;
        }

        /* Independent helper badge */
        .govguide-disclaimer-badge {
          position: fixed;
          bottom: 8px;
          left: 12px;
          background: rgba(15, 23, 42, 0.85);
          color: #f8fafc;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.3px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          user-select: none;
          z-index: 2147483645;
        }

        .govguide-disclaimer-badge .dot {
          width: 6px;
          height: 6px;
          background-color: #38bdf8;
          border-radius: 50%;
          display: inline-block;
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
          transition: all 0.35s ease-out;
        }

        /* Element Target Pulse Ring */
        .govguide-target-ring {
          position: absolute;
          border: 3px solid #2563eb;
          border-radius: 8px;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.3), 0 0 20px rgba(37, 99, 235, 0.5);
          pointer-events: none;
          z-index: 2147483642;
          transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
          animation: govguide-pulse 2s infinite ease-in-out;
        }

        @keyframes govguide-pulse {
          0% { box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.4), 0 0 15px rgba(37, 99, 235, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0.15), 0 0 25px rgba(37, 99, 235, 0.6); }
          100% { box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.4), 0 0 15px rgba(37, 99, 235, 0.4); }
        }

        /* Mascot Container */
        .govguide-mascot-container {
          position: fixed;
          width: 90px;
          height: 90px;
          z-index: 2147483644;
          pointer-events: auto;
          cursor: grab;
          transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.4s ease-out, top 0.4s ease-out;
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2));
          user-select: none;
        }

        .govguide-mascot-container:active {
          cursor: grabbing;
        }

        .govguide-mascot-container.idle-bobbing {
          animation: govguide-bob 3s ease-in-out infinite;
        }

        @keyframes govguide-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .govguide-mascot-img {
          width: 100%;
          height: 100%;
          display: block;
        }

        /* Speech Bubble */
        .govguide-speech-bubble {
          position: fixed;
          width: 320px;
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22), 0 2px 8px rgba(0, 0, 0, 0.08);
          padding: 16px;
          z-index: 2147483644;
          pointer-events: auto;
          transition: left 0.35s ease-out, top 0.35s ease-out, opacity 0.25s ease;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .govguide-bubble-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }

        .govguide-bubble-title {
          font-weight: 700;
          font-size: 13px;
          color: #1e3a8a;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .govguide-bubble-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .govguide-icon-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #475569;
          font-size: 13px;
          padding: 0;
          transition: all 0.15s ease;
        }

        .govguide-icon-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .govguide-icon-btn.active {
          background: #ef4444;
          color: #ffffff;
          border-color: #dc2626;
          animation: govguide-rec-pulse 1.2s infinite;
        }

        @keyframes govguide-rec-pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .govguide-bubble-body {
          font-size: 14px;
          color: #334155;
          line-height: 1.5;
          margin-bottom: 12px;
          min-height: 44px;
        }

        .govguide-notice-box {
          font-size: 11px;
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
          padding: 6px 8px;
          border-radius: 4px;
          margin-bottom: 10px;
          color: #1e40af;
        }

        .govguide-bubble-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid #f1f5f9;
        }

        .govguide-step-counter {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .govguide-footer-btns {
          display: flex;
          gap: 8px;
        }

        .govguide-btn {
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .govguide-btn:hover {
          background: #1d4ed8;
        }

        .govguide-btn-secondary {
          background: #f1f5f9;
          color: #334155;
        }

        .govguide-btn-secondary:hover {
          background: #e2e8f0;
        }

        /* Lang selector */
        .govguide-lang-select {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 11px;
          color: #334155;
          font-weight: 600;
          cursor: pointer;
        }

        /* Minimize trigger button when minimized */
        .govguide-restore-pill {
          position: fixed;
          bottom: 40px;
          right: 20px;
          background: #2563eb;
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 13px;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
          cursor: pointer;
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 2147483645;
          transition: transform 0.2s ease;
        }

        .govguide-restore-pill:hover {
          transform: translateY(-2px);
          background: #1d4ed8;
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
