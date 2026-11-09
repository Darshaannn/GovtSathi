/**
 * GovGuide - Speech Bubble Component
 * Renders the dialog box, text content, language switcher, voice controls,
 * and step progression buttons.
 */
(function() {
  class SpeechBubble {
    constructor(shadowRoot, options = {}) {
      this.shadowRoot = shadowRoot;
      this.options = options;
      this.container = null;
      this.bodyEl = null;
      this.titleEl = null;
      this.counterEl = null;
      this.muteBtn = null;
      this.repeatBtn = null;
      this.micBtn = null;
      this.langSelect = null;
      this.noticeBox = null;
      this.nextBtn = null;
      this.prevBtn = null;
      this.minimizeBtn = null;

      this.onNext = options.onNext || (() => {});
      this.onPrev = options.onPrev || (() => {});
      this.onMuteToggle = options.onMuteToggle || (() => {});
      this.onRepeat = options.onRepeat || (() => {});
      this.onMicToggle = options.onMicToggle || (() => {});
      this.onLangChange = options.onLangChange || (() => {});
      this.onMinimize = options.onMinimize || (() => {});

      this._buildUI();
    }

    _buildUI() {
      const bubble = document.createElement('div');
      bubble.className = 'govguide-speech-bubble';
      bubble.innerHTML = `
        <div class="govguide-bubble-header">
          <div class="govguide-bubble-title">
            <span>🧭</span> <span class="govguide-title-text">GovGuide Helper</span>
          </div>
          <div class="govguide-bubble-actions">
            <select class="govguide-lang-select" title="Switch Language">
              <option value="en">EN</option>
              <option value="hi">हिन्दी</option>
            </select>
            <button class="govguide-icon-btn govguide-mute-btn" title="Mute/Unmute Voice">🔊</button>
            <button class="govguide-icon-btn govguide-repeat-btn" title="Repeat Step">🔄</button>
            <button class="govguide-icon-btn govguide-mic-btn" title="Voice Search / Intent">🎤</button>
            <button class="govguide-icon-btn govguide-min-btn" title="Minimize Helper">➖</button>
          </div>
        </div>
        <div class="govguide-notice-box" style="display: none;"></div>
        <div class="govguide-bubble-body">Loading guide...</div>
        <div class="govguide-bubble-footer">
          <span class="govguide-step-counter">Step 1 of 1</span>
          <div class="govguide-footer-btns">
            <button class="govguide-btn govguide-btn-secondary govguide-prev-btn">Back</button>
            <button class="govguide-btn govguide-next-btn">Next</button>
          </div>
        </div>
      `;

      this.shadowRoot.appendChild(bubble);
      this.container = bubble;

      // Cache elements
      this.titleEl = bubble.querySelector('.govguide-title-text');
      this.bodyEl = bubble.querySelector('.govguide-bubble-body');
      this.noticeBox = bubble.querySelector('.govguide-notice-box');
      this.counterEl = bubble.querySelector('.govguide-step-counter');
      this.muteBtn = bubble.querySelector('.govguide-mute-btn');
      this.repeatBtn = bubble.querySelector('.govguide-repeat-btn');
      this.micBtn = bubble.querySelector('.govguide-mic-btn');
      this.langSelect = bubble.querySelector('.govguide-lang-select');
      this.minimizeBtn = bubble.querySelector('.govguide-min-btn');
      this.nextBtn = bubble.querySelector('.govguide-next-btn');
      this.prevBtn = bubble.querySelector('.govguide-prev-btn');

      // Bind events
      this.muteBtn.addEventListener('click', () => this.onMuteToggle());
      this.repeatBtn.addEventListener('click', () => this.onRepeat());
      this.micBtn.addEventListener('click', () => this.onMicToggle());
      this.minimizeBtn.addEventListener('click', () => this.onMinimize());
      this.nextBtn.addEventListener('click', () => this.onNext());
      this.prevBtn.addEventListener('click', () => this.onPrev());

      this.langSelect.addEventListener('change', (e) => {
        this.onLangChange(e.target.value);
      });
    }

    setContent(text, title, stepIndex, totalSteps, isLastStep) {
      this.bodyEl.textContent = text;
      if (title) this.titleEl.textContent = title;
      this.counterEl.textContent = `Step ${stepIndex + 1} of ${totalSteps}`;
      this.prevBtn.disabled = stepIndex === 0;
      this.prevBtn.style.opacity = stepIndex === 0 ? '0.4' : '1';
      this.nextBtn.textContent = isLastStep ? 'Done' : 'Next';
    }

    showNotice(message, onConfirm = null, confirmText = 'Allow & Continue') {
      this.noticeBox.style.display = 'block';
      this.noticeBox.innerHTML = `
        <div>${message}</div>
        ${onConfirm ? `<button class="govguide-btn" style="margin-top:6px;font-size:11px;padding:4px 10px;">${confirmText}</button>` : ''}
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
      this.muteBtn.title = isMuted ? 'Unmute Voice' : 'Mute Voice';
    }

    setListeningState(isListening) {
      if (isListening) {
        this.micBtn.classList.add('active');
        this.micBtn.title = 'Listening... Click to stop';
      } else {
        this.micBtn.classList.remove('active');
        this.micBtn.title = 'Voice Search / Intent';
      }
    }

    setLanguage(langCode) {
      if (this.langSelect) {
        this.langSelect.value = langCode;
      }
    }

    positionNear(mascotX, mascotY, mascotWidth, mascotHeight) {
      const bubbleWidth = 320;
      const bubbleHeight = this.container.offsetHeight || 160;
      const padding = 16;

      let targetX = mascotX + mascotWidth + padding;
      let targetY = mascotY - 20;

      // Boundary collision check
      if (targetX + bubbleWidth > window.innerWidth - 10) {
        // Place to left of mascot instead
        targetX = Math.max(10, mascotX - bubbleWidth - padding);
      }
      if (targetY + bubbleHeight > window.innerHeight - 10) {
        targetY = window.innerHeight - bubbleHeight - 20;
      }
      if (targetY < 10) {
        targetY = 10;
      }

      this.container.style.left = `${targetX}px`;
      this.container.style.top = `${targetY}px`;
    }

    setVisible(visible) {
      this.container.style.display = visible ? 'block' : 'none';
    }
  }

  window.GovGuideSpeechBubble = SpeechBubble;
})();
