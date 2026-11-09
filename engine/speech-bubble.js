/**
 * GovGuide - Speech Bubble Component
 * Features:
 * - Rounded soft-shadow modern speech bubble with directional tail
 * - Step progress indicator ("Step X of Y")
 * - Smart anti-collision positioning: never covers highlighted element
 * - Text size switcher (small, medium, large) persisted to storage
 * - Unreviewed language disclaimer notice
 * - Fully accessible: aria-live, tooltips, visible focus, min 44px targets
 */
(function() {
  const PREF_TEXT_SIZE_KEY = 'govguide_text_size_pref';

  class SpeechBubble {
    constructor(shadowRoot, options = {}) {
      this.shadowRoot = shadowRoot;
      this.options = options;
      this.container = null;
      this.tailEl = null;
      this.bodyEl = null;
      this.titleEl = null;
      this.counterEl = null;
      this.unreviewedPill = null;
      this.muteBtn = null;
      this.repeatBtn = null;
      this.micBtn = null;
      this.textSizeBtn = null;
      this.langSelect = null;
      this.noticeBox = null;
      this.nextBtn = null;
      this.prevBtn = null;
      this.minimizeBtn = null;

      this.currentTextSize = 'medium'; // 'small' | 'medium' | 'large'
      this.currentLang = 'en';
      this.highlightedRect = null;

      this.onNext = options.onNext || (() => {});
      this.onPrev = options.onPrev || (() => {});
      this.onMuteToggle = options.onMuteToggle || (() => {});
      this.onRepeat = options.onRepeat || (() => {});
      this.onMicToggle = options.onMicToggle || (() => {});
      this.onLangChange = options.onLangChange || (() => {});
      this.onMinimize = options.onMinimize || (() => {});
      this.onTextSizeChange = options.onTextSizeChange || (() => {});

      this._buildUI();
      this._loadTextSizePreference();
    }

    async _loadTextSizePreference() {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([PREF_TEXT_SIZE_KEY], (res) => {
          if (res[PREF_TEXT_SIZE_KEY]) {
            this.setTextSize(res[PREF_TEXT_SIZE_KEY]);
          }
        });
      }
    }

    setTextSize(size) {
      if (!['small', 'medium', 'large'].includes(size)) size = 'medium';
      this.currentTextSize = size;
      this.container.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
      this.container.classList.add(`text-size-${size}`);
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [PREF_TEXT_SIZE_KEY]: size });
      }
      this.onTextSizeChange(size);
    }

    cycleTextSize() {
      const order = ['small', 'medium', 'large'];
      const nextIdx = (order.indexOf(this.currentTextSize) + 1) % order.length;
      this.setTextSize(order[nextIdx]);
    }

    _buildUI() {
      const bubble = document.createElement('div');
      bubble.className = 'govguide-speech-bubble text-size-medium';
      bubble.setAttribute('role', 'region');
      bubble.setAttribute('aria-label', 'GovGuide Interactive Companion');

      // Populate Language options from central registry
      const langs = (window.GovGuideLanguages && window.GovGuideLanguages.LanguageRegistry)
        ? window.GovGuideLanguages.LanguageRegistry.getAll()
        : [
            { code: 'en', nativeName: 'English' },
            { code: 'hi', nativeName: 'हिन्दी' }
          ];

      const langOptionsHtml = langs.map(l =>
        `<option value="${l.code}">${l.nativeName}</option>`
      ).join('');

      bubble.innerHTML = `
        <div class="govguide-bubble-tail tail-left"></div>
        <div class="govguide-bubble-header">
          <div class="govguide-bubble-title">
            <span aria-hidden="true">🧭</span>
            <span class="govguide-title-text">GovGuide Helper</span>
          </div>
          <div class="govguide-bubble-actions">
            <select class="govguide-lang-select" title="Switch Language" aria-label="Switch Language">
              ${langOptionsHtml}
            </select>
            <button class="govguide-icon-btn govguide-text-size-btn" title="Text Size: Small / Medium / Large" aria-label="Toggle Text Size">
              <span style="font-size:13px; font-weight:700;">aA</span>
            </button>
            <button class="govguide-icon-btn govguide-mute-btn" title="Mute/Unmute Voice" aria-label="Toggle Voice Mute">🔊</button>
            <button class="govguide-icon-btn govguide-repeat-btn" title="Repeat Step" aria-label="Repeat Step Instruction">🔄</button>
            <button class="govguide-icon-btn govguide-mic-btn" title="Voice Search" aria-label="Voice Search / Intent">🎤</button>
            <button class="govguide-icon-btn govguide-min-btn" title="Minimize Helper" aria-label="Minimize Guide">➖</button>
          </div>
        </div>
        <div class="govguide-unreviewed-pill" style="display: none;" role="note">
          <span aria-hidden="true">⚠️</span>
          <span class="govguide-unreviewed-text">Translation not yet checked by a native speaker</span>
        </div>
        <div class="govguide-notice-box" style="display: none;" role="alert"></div>
        <div class="govguide-bubble-body" aria-live="polite" aria-atomic="true">Loading guide...</div>
        <div class="govguide-bubble-footer">
          <div class="govguide-step-progress">
            <span class="govguide-step-counter">Step 1 of 1</span>
          </div>
          <div class="govguide-footer-btns">
            <button class="govguide-btn govguide-btn-secondary govguide-prev-btn" aria-label="Previous step">Back</button>
            <button class="govguide-btn govguide-next-btn" aria-label="Next step">Next</button>
          </div>
        </div>
      `;

      this.shadowRoot.appendChild(bubble);
      this.container = bubble;
      this.tailEl = bubble.querySelector('.govguide-bubble-tail');

      // Cache elements
      this.titleEl = bubble.querySelector('.govguide-title-text');
      this.bodyEl = bubble.querySelector('.govguide-bubble-body');
      this.noticeBox = bubble.querySelector('.govguide-notice-box');
      this.unreviewedPill = bubble.querySelector('.govguide-unreviewed-pill');
      this.counterEl = bubble.querySelector('.govguide-step-counter');
      this.muteBtn = bubble.querySelector('.govguide-mute-btn');
      this.repeatBtn = bubble.querySelector('.govguide-repeat-btn');
      this.micBtn = bubble.querySelector('.govguide-mic-btn');
      this.textSizeBtn = bubble.querySelector('.govguide-text-size-btn');
      this.langSelect = bubble.querySelector('.govguide-lang-select');
      this.minimizeBtn = bubble.querySelector('.govguide-min-btn');
      this.nextBtn = bubble.querySelector('.govguide-next-btn');
      this.prevBtn = bubble.querySelector('.govguide-prev-btn');

      // Bind events
      this.muteBtn.addEventListener('click', () => this.onMuteToggle());
      this.repeatBtn.addEventListener('click', () => this.onRepeat());
      this.micBtn.addEventListener('click', () => this.onMicToggle());
      this.textSizeBtn.addEventListener('click', () => this.cycleTextSize());
      this.minimizeBtn.addEventListener('click', () => this.onMinimize());
      this.nextBtn.addEventListener('click', () => this.onNext());
      this.prevBtn.addEventListener('click', () => this.onPrev());

      this.langSelect.addEventListener('change', (e) => {
        this.onLangChange(e.target.value);
      });
    }

    setContent(text, title, stepIndex, totalSteps, isLastStep, langCode = 'en') {
      this.currentLang = langCode;
      this.bodyEl.textContent = text || '';
      if (title) this.titleEl.textContent = title;

      // Localize Step Progress counter
      const stepStr = (window.GovGuideLanguages && window.GovGuideLanguages.LanguageRegistry)
        ? window.GovGuideLanguages.LanguageRegistry.getString('stepPrefix', langCode)
        : 'Step';
      const ofStr = (window.GovGuideLanguages && window.GovGuideLanguages.LanguageRegistry)
        ? window.GovGuideLanguages.LanguageRegistry.getString('stepOf', langCode)
        : 'of';

      this.counterEl.textContent = `${stepStr} ${stepIndex + 1} ${ofStr} ${totalSteps}`;

      // Localize Prev and Next button text
      const prevText = (window.GovGuideLanguages && window.GovGuideLanguages.LanguageRegistry)
        ? window.GovGuideLanguages.LanguageRegistry.getString('prevBtn', langCode)
        : 'Back';
      const nextText = (window.GovGuideLanguages && window.GovGuideLanguages.LanguageRegistry)
        ? window.GovGuideLanguages.LanguageRegistry.getString('nextBtn', langCode)
        : 'Next';

      this.prevBtn.textContent = prevText;
      this.prevBtn.disabled = stepIndex === 0;
      this.prevBtn.style.opacity = stepIndex === 0 ? '0.4' : '1';
      this.nextBtn.textContent = isLastStep ? (langCode === 'hi' ? 'समाप्त' : 'Done') : nextText;

      // Check reviewed flag for language
      const isReviewed = (window.GovGuideLanguages && window.GovGuideLanguages.LanguageRegistry)
        ? window.GovGuideLanguages.LanguageRegistry.isReviewed(langCode)
        : true;

      if (!isReviewed) {
        this.unreviewedPill.style.display = 'flex';
        const unreviewedMsg = window.GovGuideLanguages.LanguageRegistry.getString('unreviewedNotice', langCode);
        this.unreviewedPill.querySelector('.govguide-unreviewed-text').textContent = unreviewedMsg;
      } else {
        this.unreviewedPill.style.display = 'none';
      }
    }

    setHighlightedTargetRect(rect) {
      this.highlightedRect = rect;
    }

    showNotice(message, onConfirm = null, confirmText = 'Allow & Continue') {
      this.noticeBox.style.display = 'block';
      this.noticeBox.innerHTML = `
        <div>${message}</div>
        ${onConfirm ? `<button class="govguide-btn" style="margin-top:8px;font-size:12px;padding:6px 14px;">${confirmText}</button>` : ''}
      `;
      if (onConfirm) {
        const btn = this.noticeBox.querySelector('button');
        btn.addEventListener('click', () => {
          this.hideNotice();
          onConfirm();
        }, { once: true });
      }
    }

    hideNotice() {
      this.noticeBox.style.display = 'none';
      this.noticeBox.innerHTML = '';
    }

    setMutedState(isMuted) {
      this.muteBtn.textContent = isMuted ? '🔇' : '🔊';
      const muteKey = isMuted ? 'unmuteBtn' : 'muteBtn';
      const tooltip = (window.GovGuideLanguages && window.GovGuideLanguages.LanguageRegistry)
        ? window.GovGuideLanguages.LanguageRegistry.getString(muteKey, this.currentLang)
        : (isMuted ? 'Unmute Voice' : 'Mute Voice');
      this.muteBtn.title = tooltip;
      this.muteBtn.setAttribute('aria-label', tooltip);
    }

    setListeningState(isListening) {
      if (isListening) {
        this.micBtn.classList.add('active');
        this.micBtn.title = 'Listening... Click to stop';
      } else {
        this.micBtn.classList.remove('active');
        this.micBtn.title = 'Voice Search';
      }
    }

    setLanguage(langCode) {
      this.currentLang = langCode;
      if (this.langSelect) {
        this.langSelect.value = langCode;
      }
    }

    /**
     * Smart positioning ensuring:
     * 1. Bubble is near the mascot.
     * 2. Bubble NEVER overlaps the highlighted target element.
     * 3. Adapts dynamically on small screen viewports (down to 360px).
     * 4. Aligns directional tail towards the mascot.
     */
    positionNear(mascotX, mascotY, mascotWidth, mascotHeight) {
      const bubbleWidth = Math.min(340, window.innerWidth - 20);
      this.container.style.width = `${bubbleWidth}px`;
      const bubbleHeight = this.container.offsetHeight || 180;
      const margin = 16;

      const overlaps = (ax, ay, aw, ah, b) => {
        if (!b) return false;
        return !(
          ax + aw < b.left ||
          ax > b.right ||
          ay + ah < b.top ||
          ay > b.bottom
        );
      };

      // Candidate placements:
      // 1. Right of mascot
      // 2. Left of mascot
      // 3. Below mascot
      // 4. Above mascot
      // 5. Far bottom-right or top-right quadrant if target is center
      const candidates = [
        { x: mascotX + mascotWidth + margin, y: mascotY, tail: 'tail-left' },
        { x: mascotX - bubbleWidth - margin, y: mascotY, tail: 'tail-right' },
        { x: Math.max(10, mascotX - 20), y: mascotY + mascotHeight + margin, tail: 'tail-top' },
        { x: Math.max(10, mascotX - 20), y: mascotY - bubbleHeight - margin, tail: 'tail-bottom' },
        { x: Math.max(10, window.innerWidth - bubbleWidth - 20), y: Math.max(10, window.innerHeight - bubbleHeight - 60), tail: 'tail-left' },
        { x: 20, y: Math.max(10, window.innerHeight - bubbleHeight - 60), tail: 'tail-left' }
      ];

      let bestPos = null;
      for (const pos of candidates) {
        // Clamp pos to viewport
        const clampedX = Math.max(10, Math.min(window.innerWidth - bubbleWidth - 10, pos.x));
        const clampedY = Math.max(10, Math.min(window.innerHeight - bubbleHeight - 10, pos.y));

        // Highlighted element collision check
        if (this.highlightedRect && overlaps(clampedX, clampedY, bubbleWidth, bubbleHeight, this.highlightedRect)) {
          continue; // Overlaps target element, discard candidate
        }

        bestPos = { x: clampedX, y: clampedY, tail: pos.tail };
        break;
      }

      // If all overlap, find position with maximum vertical distance from target
      if (!bestPos) {
        let fx = Math.max(10, Math.min(window.innerWidth - bubbleWidth - 10, mascotX));
        let fy = 20;
        if (this.highlightedRect) {
          if (this.highlightedRect.top > bubbleHeight + 30) {
            fy = Math.max(10, this.highlightedRect.top - bubbleHeight - 16);
          } else if (this.highlightedRect.bottom + bubbleHeight + 30 < window.innerHeight) {
            fy = this.highlightedRect.bottom + 16;
          }
        }
        bestPos = { x: fx, y: fy, tail: 'tail-left' };
      }

      this.container.style.left = `${Math.round(bestPos.x)}px`;
      this.container.style.top = `${Math.round(bestPos.y)}px`;

      // Update tail class
      if (this.tailEl) {
        this.tailEl.className = `govguide-bubble-tail ${bestPos.tail}`;
      }
    }

    setVisible(visible) {
      this.container.style.display = visible ? 'block' : 'none';
    }
  }

  window.GovGuideSpeechBubble = SpeechBubble;
})();
