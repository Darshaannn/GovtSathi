/**
 * GovGuide - Step Runner
 * State machine managing current flow, pages, steps, triggers, and language.
 * Upgraded Features:
 * - Robust Fallback to English on missing translation keys (never blank or undefined)
 * - Safe pre-recorded audio playback handling (`step.audio[lang]`)
 * - Mascot speaking animation synchronization
 * - Notice presentation when language voice is not supported on user's device
 * - Persisted language & session state
 * - Quick-Reply chips answers ("about", "documents", "stuck", "next")
 * - Explain-This-Field mode: Zero form field `.value` read, generic privacy protection on sensitive inputs
 * - Document checklist ticks persistence per flow (`chrome.storage.local`)
 * - Inactivity nudge timer (~20s, once per step, configurable via pref)
 * - Step celebration animation on completion
 * - Strict Privacy & Safety: NEVER inspects or reads form input values.
 */
(function() {
  const PREF_LANG_KEY = 'govguide_user_lang_pref';
  const SESSION_PROGRESS_KEY = 'govguide_session_progress';
  const PREF_NUDGE_KEY = 'govguide_nudge_enabled';
  const CHECKLIST_STORAGE_PREFIX = 'govguide_checklist_';

  // Toggle for debug logs
  const GOVGUIDE_DEBUG = false;
  function log(...args) {
    if (GOVGUIDE_DEBUG) {
      console.log('[GovGuide]', ...args);
    }
  }

  class StepRunner {
    constructor(guideData, shadowRoot, highlighter, mascot, bubble, speech) {
      this.guide = guideData;
      this.shadowRoot = shadowRoot;
      this.highlighter = highlighter;
      this.mascot = mascot;
      this.bubble = bubble;
      this.speech = speech;

      this.currentFlow = (guideData && guideData.flows && guideData.flows[0]) || null;
      this.currentPage = null;
      this.currentStepIndex = 0;
      this.currentLanguage = (guideData && guideData.defaultLanguage) || 'en';
      this.currentEventListener = null;
      this.currentEventElement = null;
      this.currentEventType = null;
      this.observer = null;
      this.observerThrottleTimer = null;

      // Inactivity nudge state
      this.nudgeTimer = null;
      this.nudgeFiredForCurrentStep = false;
      this.isNudgeEnabled = true;

      // Explain-This-Field mode state
      this.isExplainModeActive = false;
      this.boundFieldClickListener = null;

      // Document checklist state
      this.checklistTicks = {};

      // Connect speech state to mascot speaking animation
      this.speech.onSpeakingChange = (isSpeaking) => {
        this.mascot.setSpeaking(isSpeaking);
      };

      // Connect voice absence alert
      this.speech.onNoVoiceAvailable = (langCode) => {
        const msg = (window.GovGuideLanguages && window.GovGuideLanguages.LanguageRegistry)
          ? window.GovGuideLanguages.LanguageRegistry.getString('noVoiceNotice', langCode)
          : 'Voice reading is unavailable for this language on your device. Displaying text instructions.';
        this.bubble.showNotice(msg);
      };

      // Wire speech bubble interactions
      this._wireBubbleInteractions();

      // Immediate synchronous detection
      this.detectAndApplyPage();
      this._setupDomObserver();

      // Asynchronous initialization of preferences and session state
      this._initAsync();
    }

    _wireBubbleInteractions() {
      // Wire chip click handler
      this.bubble.onChipClick = (chipType) => {
        this._handleChipAction(chipType);
      };

      // Wire explain-this-field toggle
      this.bubble.onExplainFieldToggle = (active) => {
        this.setExplainFieldMode(active);
      };

      // Wire checklist tick handler
      this.bubble.onChecklistTick = (docId, isChecked) => {
        this._saveChecklistTick(docId, isChecked);
      };
    }

    async _initAsync() {
      // Load saved language preference
      const savedLang = await this._loadLangPreference();
      if (savedLang) {
        this.currentLanguage = savedLang;
        this.bubble.setLanguage(this.currentLanguage);
        this.speech.setLanguage(this.currentLanguage);
      }

      // Load nudge preference
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([PREF_NUDGE_KEY], (res) => {
          if (typeof res[PREF_NUDGE_KEY] === 'boolean') {
            this.isNudgeEnabled = res[PREF_NUDGE_KEY];
          }
        });
      }

      // Load checklist ticks for current flow
      await this._loadChecklistTicks();

      // Check session storage for flow progression
      const savedSession = await this._loadSessionProgress();
      if (savedSession && savedSession.flowId && this.guide.flows) {
        const found = this.guide.flows.find(f => f.flowId === savedSession.flowId);
        if (found && found.flowId !== this.currentFlow.flowId) {
          this.currentFlow = found;
          this.detectAndApplyPage();
        }
      }
    }

    _setupDomObserver() {
      if (typeof MutationObserver === 'undefined') return;

      this.observer = new MutationObserver(() => {
        if (this.observerThrottleTimer) return;
        this.observerThrottleTimer = setTimeout(() => {
          this.observerThrottleTimer = null;
          this.detectAndApplyPage();
        }, 400); // 400ms throttle
      });

      this.observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'id']
      });
    }

    detectAndApplyPage() {
      if (!this.currentFlow || !this.currentFlow.pages) return;

      const currentUrl = window.__govguide_mock_url || window.location.href;
      const currentTitle = document.title || '';

      log('Evaluating page match. URL:', currentUrl, '| Title:', currentTitle);

      let matchedPage = null;
      for (const page of this.currentFlow.pages) {
        const match = page.match;
        if (!match) continue;

        // 1. URL regex match
        let urlMatches = false;
        if (match.urlRegex) {
          try {
            urlMatches = new RegExp(match.urlRegex, 'i').test(currentUrl);
          } catch (e) {
            log('Regex error for page', page.pageId, e.message);
          }
        } else {
          urlMatches = true;
        }

        if (!urlMatches) {
          log('Page', page.pageId, 'rejected: URL regex mismatch');
          continue;
        }

        // 2. Title match (if specified)
        if (match.pageTitle) {
          const titleMatches = currentTitle.toLowerCase().includes(match.pageTitle.toLowerCase());
          if (!titleMatches) {
            log('Page', page.pageId, 'rejected: Page title mismatch (expected:', match.pageTitle, ')');
            continue;
          }
        }

        // 3. DOM Element presence / state (if specified)
        if (match.elementPresence) {
          let hasEl = false;
          try {
            const el = document.querySelector(match.elementPresence);
            if (el && window.GovGuideElementFinder.isVisible(el)) {
              hasEl = true;
            }
          } catch (e) {
            hasEl = false;
          }

          if (!hasEl) {
            log('Page', page.pageId, 'rejected: Required element not visible:', match.elementPresence);
            continue;
          }
        }

        log('Matched page rule:', page.pageId);
        matchedPage = page;
        break;
      }

      if (matchedPage) {
        if (!this.currentPage || this.currentPage.pageId !== matchedPage.pageId) {
          this.currentPage = matchedPage;
          this.currentStepIndex = 0;
          this._saveSessionProgress();
          this._loadChecklistTicks();
          this.runStep(this.currentStepIndex);
        }
      } else {
        log('No matching page rule found for current URL:', currentUrl);
      }
    }

    runStep(index) {
      if (!this.currentPage || !this.currentPage.steps || this.currentPage.steps.length === 0) {
        return;
      }

      this._cleanupCurrentListener();
      this._resetNudgeTimer();

      if (index < 0) index = 0;
      if (index >= this.currentPage.steps.length) {
        this._showCompletionState();
        return;
      }

      this.currentStepIndex = index;
      const step = this.currentPage.steps[index];
      log('Running step:', step.stepId, '| Order:', step.order);

      // Check skipIfNotFound
      let targetEl = null;
      if (step.target) {
        targetEl = window.GovGuideElementFinder.find(step.target);
      }

      if (!targetEl && step.skipIfNotFound) {
        log('Step', step.stepId, 'has skipIfNotFound and element was not found. Skipping to next step.');
        this.runStep(index + 1);
        return;
      }

      // Safe bilingual translation extraction with fallback to English
      const messages = this._resolveStepMessage(step.messages);
      const fallbackText = this._resolveFallbackText(step.fallback);

      const title = this.currentFlow.name ? this._resolveLocalizedText(this.currentFlow.name) : 'GovGuide';
      const isLast = (index === this.currentPage.steps.length - 1);

      // Audio configuration if provided
      const audioUrl = (step.audio && (step.audio[this.currentLanguage] || step.audio.en)) || null;

      if (step.actionType === 'explain_only') {
        this.highlighter.clear();
        this.bubble.setHighlightedTargetRect(null);
        this.mascot.moveToCorner();
        this.mascot.setExpression('idle');
        this.bubble.setContent(messages.bubble, title, index, this.currentPage.steps.length, isLast, this.currentLanguage);
        this.bubble.positionNear(this.mascot.currentX, this.mascot.currentY, 90, 90);
        this.speech.speak(messages.speech, { audioUrl });
        this._startNudgeTimer();
        return;
      }

      // Action type: point_and_click / focus / change
      if (targetEl) {
        const targetRect = targetEl.getBoundingClientRect();
        this.highlighter.highlight(targetEl, true);
        this.mascot.moveToTarget(targetEl);
        this.bubble.setHighlightedTargetRect({
          left: targetRect.left - 10,
          top: targetRect.top - 10,
          right: targetRect.right + 10,
          bottom: targetRect.bottom + 10,
          width: targetRect.width + 20,
          height: targetRect.height + 20
        });
        this.bubble.setContent(messages.bubble, title, index, this.currentPage.steps.length, isLast, this.currentLanguage);
        this.bubble.positionNear(this.mascot.currentX, this.mascot.currentY, 90, 90);
        this.speech.speak(messages.speech, { audioUrl });
        this._bindStepDoneTrigger(step.stepDoneTrigger, targetEl);
      } else {
        log('Target element not found for step:', step.stepId);
        this.highlighter.clear();
        this.bubble.setHighlightedTargetRect(null);
        this.mascot.moveToCorner();
        this.mascot.setExpression('confused');
        const displayMsg = fallbackText || messages.bubble;
        this.bubble.setContent(displayMsg, title, index, this.currentPage.steps.length, isLast, this.currentLanguage);
        this.bubble.positionNear(this.mascot.currentX, this.mascot.currentY, 90, 90);
        this.speech.speak(displayMsg, { audioUrl });
      }

      this._startNudgeTimer();
    }

    /* -------------------------------------------------------------
     * Quick-Reply Chips Handling
     * ------------------------------------------------------------- */
    _handleChipAction(chipType) {
      if (!this.currentPage) return;
      this._resetNudgeTimer();

      if (chipType === 'what-is-page') {
        const text = this._resolveContentField(this.currentPage.about, {
          en: "This page is part of the official portal workflow. Follow the instructions to proceed.",
          hi: "यह पृष्ठ आधिकारिक पोर्टल प्रक्रिया का एक भाग है। आगे बढ़ने के लिए निर्देशों का पालन करें।"
        });
        this.bubble.bodyEl.textContent = text.bubble;
        this.mascot.setExpression('idle');
        this.speech.speak(text.speech);
      } else if (chipType === 'documents') {
        const docList = this.currentPage.documents || (this.currentFlow && this.currentFlow.documents) || [];
        if (docList.length > 0) {
          this.bubble.showChecklist(docList, this.checklistTicks, (docId, isChecked) => {
            this._saveChecklistTick(docId, isChecked);
          });
        }
        const text = this._resolveContentField(this.currentPage.documentsSummary || this.currentPage.documents, {
          en: "Here are the documents you will need for this step. Check each one off as you prepare it.",
          hi: "इस चरण के लिए आपको जिन दस्तावेज़ों की आवश्यकता होगी, वे यहाँ हैं। तैयारी होने पर प्रत्येक को चेक करें।"
        });
        this.bubble.bodyEl.textContent = text.bubble;
        this.mascot.setExpression('pointing');
        this.speech.speak(text.speech);
      } else if (chipType === 'stuck') {
        const text = this._resolveContentField(this.currentPage.stuck, {
          en: "If you are stuck, double-check that required dropdowns or options are selected before clicking Next.",
          hi: "यदि आप अटक गए हैं, तो आगे बढ़ने से पहले सुनिश्चित करें कि आवश्यक विकल्प चुने गए हैं।"
        });
        this.bubble.bodyEl.textContent = text.bubble;
        this.mascot.setExpression('thinking');
        this.speech.speak(text.speech);
      } else if (chipType === 'next') {
        const text = this._resolveContentField(this.currentPage.next, {
          en: "Once you complete this screen, the portal will move to the next step of your application.",
          hi: "इस स्क्रीन को पूरा करने के बाद, पोर्टल आपके आवेदन के अगले चरण पर जाएगा।"
        });
        this.bubble.bodyEl.textContent = text.bubble;
        this.mascot.setExpression('pointing');
        this.speech.speak(text.speech);
      }
    }

    _resolveContentField(fieldObj, fallbackDict) {
      if (!fieldObj) {
        const fb = fallbackDict[this.currentLanguage] || fallbackDict.en;
        return { bubble: fb, speech: fb };
      }

      // If fieldObj is array of documents
      if (Array.isArray(fieldObj)) {
        const items = fieldObj.map(item => {
          if (typeof item === 'object') return item[this.currentLanguage] || item.en || '';
          return String(item);
        });
        const summary = items.join(', ');
        return { bubble: summary, speech: summary };
      }

      const langData = fieldObj[this.currentLanguage];
      if (langData) {
        if (typeof langData === 'string') return { bubble: langData, speech: langData };
        return {
          bubble: langData.bubble || langData.spoken || langData.speech || '',
          speech: langData.spoken || langData.speech || langData.bubble || ''
        };
      }

      // Fallback to English
      const enData = fieldObj.en || {};
      if (typeof enData === 'string') return { bubble: enData, speech: enData };
      const bubble = enData.bubble || enData.spoken || enData.speech || fallbackDict.en;
      const speech = enData.spoken || enData.speech || enData.bubble || fallbackDict.en;
      return { bubble, speech };
    }

    /* -------------------------------------------------------------
     * Document Checklist Persistence
     * ------------------------------------------------------------- */
    async _loadChecklistTicks() {
      if (!this.currentFlow) return;
      const storageKey = `${CHECKLIST_STORAGE_PREFIX}${this.currentFlow.flowId}`;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([storageKey], (res) => {
          this.checklistTicks = (res && res[storageKey]) || {};
        });
      } else {
        try {
          const raw = localStorage.getItem(storageKey);
          this.checklistTicks = raw ? JSON.parse(raw) : {};
        } catch (e) {
          this.checklistTicks = {};
        }
      }
    }

    _saveChecklistTick(docId, isChecked) {
      if (!this.currentFlow) return;
      this.checklistTicks[docId] = !!isChecked;
      const storageKey = `${CHECKLIST_STORAGE_PREFIX}${this.currentFlow.flowId}`;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [storageKey]: this.checklistTicks });
      } else {
        try {
          localStorage.setItem(storageKey, JSON.stringify(this.checklistTicks));
        } catch (e) {}
      }
    }

    /* -------------------------------------------------------------
     * Explain-This-Field Mode (Strict Privacy Guaranteed)
     * ------------------------------------------------------------- */
    setExplainFieldMode(active) {
      this.isExplainModeActive = !!active;
      if (this.isExplainModeActive) {
        this.mascot.setExpression('thinking');
        this._bindFieldClickListener();
      } else {
        this._unbindFieldClickListener();
        this.mascot.setExpression('idle');
      }
    }

    _bindFieldClickListener() {
      if (this.boundFieldClickListener) return;

      this.boundFieldClickListener = (e) => {
        // Find if user clicked an input, select, textarea, or label
        const target = e.target;
        if (!target) return;

        const isFormEl = target.matches('input, select, textarea, label, [role="textbox"], [role="combobox"]');
        const formContainer = target.closest('label, .form-group, .form-field, tr, td');
        
        if (!isFormEl && !formContainer) return;

        // User clicked a field or field container while in explain mode
        e.preventDefault();
        e.stopPropagation();

        const inputEl = isFormEl && target.tagName !== 'LABEL' ? target : (formContainer ? formContainer.querySelector('input, select, textarea') : null);

        this._explainElementSafely(inputEl || target);
      };

      document.addEventListener('click', this.boundFieldClickListener, true);
    }

    _unbindFieldClickListener() {
      if (this.boundFieldClickListener) {
        document.removeEventListener('click', this.boundFieldClickListener, true);
        this.boundFieldClickListener = null;
      }
    }

    /**
     * Inspects STRICTLY label text, name, placeholder, or aria-label.
     * NEVER reads `el.value`!
     */
    _explainElementSafely(el) {
      if (!el) return;

      // Check if this is a sensitive field (password, OTP, Aadhaar, captcha, etc.)
      const isSensitive = this._isSensitiveElement(el);
      if (isSensitive) {
        const secureNotice = (window.GovGuideLanguages && window.GovGuideLanguages.LanguageRegistry)
          ? window.GovGuideLanguages.LanguageRegistry.getString('secureFieldNotice', this.currentLanguage)
          : 'This is a secure input field. GovGuide never reads, stores, or inspects your personal values.';
        this.bubble.bodyEl.textContent = secureNotice;
        this.mascot.setExpression('pointing');
        this.speech.speak(secureNotice);
        return;
      }

      // Check for guide-supplied explanation in current page
      const guideExplanation = this._findGuideFieldExplanation(el);
      if (guideExplanation) {
        this.bubble.bodyEl.textContent = guideExplanation;
        this.mascot.setExpression('pointing');
        this.speech.speak(guideExplanation);
        return;
      }

      // Extract safe descriptive label (strictly text, NEVER field values)
      const labelText = this._extractLabelText(el);
      if (labelText) {
        const expText = this.currentLanguage === 'hi'
          ? `यह फ़ील्ड "${labelText}" के लिए है। कृपया संबंधित जानकारी दर्ज करें।`
          : `This field is for "${labelText}". Please enter the required details.`;
        this.bubble.bodyEl.textContent = expText;
        this.mascot.setExpression('pointing');
        this.speech.speak(expText);
      } else {
        const generalText = this.currentLanguage === 'hi'
          ? 'यह एक इनपुट फ़ील्ड है। अपनी जानकारी दर्ज करने के बाद अगला चरण देखें।'
          : 'This is a form input field. Fill in the required detail to proceed.';
        this.bubble.bodyEl.textContent = generalText;
        this.mascot.setExpression('pointing');
        this.speech.speak(generalText);
      }
    }

    _isSensitiveElement(el) {
      if (!el) return false;
      const type = (el.type || '').toLowerCase();
      const name = (el.name || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      const placeholder = (el.placeholder || '').toLowerCase();
      const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();

      const sensitiveKeywords = ['password', 'pwd', 'otp', 'aadhaar', 'uid', 'captcha', 'secret', 'cvv', 'pin', 'token'];
      return type === 'password' || sensitiveKeywords.some(kw => 
        name.includes(kw) || id.includes(kw) || placeholder.includes(kw) || ariaLabel.includes(kw)
      );
    }

    _extractLabelText(el) {
      // 1. Check aria-label or title
      const aria = el.getAttribute('aria-label') || el.getAttribute('title');
      if (aria && aria.trim()) return aria.trim();

      // 2. Check for explicit <label for="id">
      if (el.id) {
        try {
          const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
          if (lbl && lbl.textContent && lbl.textContent.trim()) {
            return lbl.textContent.trim().replace(/\s+/g, ' ');
          }
        } catch (e) {}
      }

      // 3. Check enclosing label
      const parentLabel = el.closest('label');
      if (parentLabel && parentLabel.textContent) {
        return parentLabel.textContent.trim().replace(/\s+/g, ' ');
      }

      // 4. Check nearby label or preceding sibling
      const parentCol = el.closest('td, .form-group, div');
      if (parentCol) {
        const prevLabel = parentCol.querySelector('label, th, b, strong');
        if (prevLabel && prevLabel.textContent && prevLabel.textContent.trim()) {
          return prevLabel.textContent.trim().replace(/\s+/g, ' ');
        }
      }

      return null;
    }

    _findGuideFieldExplanation(el) {
      if (!this.currentPage || !this.currentPage.fieldExplanations) return null;
      for (const item of this.currentPage.fieldExplanations) {
        if (item.selector) {
          try {
            if (el.matches(item.selector)) {
              return typeof item.text === 'object'
                ? (item.text[this.currentLanguage] || item.text.en)
                : item.text;
            }
          } catch (e) {}
        }
      }
      return null;
    }

    /* -------------------------------------------------------------
     * Inactivity Nudge & Step Done Celebration
     * ------------------------------------------------------------- */
    _startNudgeTimer() {
      this._resetNudgeTimer();
      if (!this.isNudgeEnabled || this.nudgeFiredForCurrentStep) return;

      this.nudgeTimer = setTimeout(() => {
        if (this.nudgeFiredForCurrentStep) return;
        this.nudgeFiredForCurrentStep = true;
        this._triggerInactivityNudge();
      }, 20000); // 20 seconds
    }

    _resetNudgeTimer() {
      if (this.nudgeTimer) {
        clearTimeout(this.nudgeTimer);
        this.nudgeTimer = null;
      }
      this.nudgeFiredForCurrentStep = false;
    }

    _triggerInactivityNudge() {
      const nudgeMsg = (window.GovGuideLanguages && window.GovGuideLanguages.LanguageRegistry)
        ? window.GovGuideLanguages.LanguageRegistry.getString('nudgePrompt', this.currentLanguage)
        : 'Take your time. Whenever you are ready, follow the highlighted step or click "Next".';

      this.bubble.bodyEl.textContent = nudgeMsg;
      this.mascot.setExpression('thinking');
      this.speech.speak(nudgeMsg);
    }

    _resolveStepMessage(messagesObj) {
      if (!messagesObj) {
        return { speech: '', bubble: '' };
      }
      const langMsg = messagesObj[this.currentLanguage];
      if (langMsg && (langMsg.bubble || langMsg.spoken || langMsg.speech)) {
        return {
          speech: langMsg.spoken || langMsg.speech || langMsg.bubble || '',
          bubble: langMsg.bubble || langMsg.spoken || langMsg.speech || ''
        };
      }
      // Fallback to English
      const enMsg = messagesObj.en || {};
      return {
        speech: enMsg.spoken || enMsg.speech || enMsg.bubble || '',
        bubble: enMsg.bubble || enMsg.spoken || enMsg.speech || ''
      };
    }

    _resolveFallbackText(fallbackObj) {
      if (!fallbackObj) return null;
      if (typeof fallbackObj === 'string') return fallbackObj;
      if (fallbackObj[this.currentLanguage]) return fallbackObj[this.currentLanguage];
      return fallbackObj.en || null;
    }

    _resolveLocalizedText(textObj) {
      if (!textObj) return '';
      if (typeof textObj === 'string') return textObj;
      if (textObj[this.currentLanguage]) return textObj[this.currentLanguage];
      return textObj.en || '';
    }

    _bindStepDoneTrigger(trigger, element) {
      if (!trigger) return;

      const eventType = trigger.type || 'click';
      const targetElement = element || (trigger.selector ? document.querySelector(trigger.selector) : null);
      if (!targetElement) return;

      this.currentEventElement = targetElement;
      this.currentEventType = eventType;

      this.currentEventListener = () => {
        log('StepDone trigger detected:', eventType);
        this._cleanupCurrentListener();
        // Mascot celebration on step completion
        this.mascot.celebrate(1800);
        setTimeout(() => this.nextStep(), 500);
      };

      try {
        targetElement.addEventListener(eventType, this.currentEventListener, { once: true });
      } catch (e) {
        log('Failed to bind step trigger:', e.message);
      }
    }

    _cleanupCurrentListener() {
      if (this.currentEventElement && this.currentEventListener && this.currentEventType) {
        try {
          this.currentEventElement.removeEventListener(this.currentEventType, this.currentEventListener);
        } catch (e) {}
      }
      this.currentEventListener = null;
      this.currentEventElement = null;
      this.currentEventType = null;
    }

    nextStep() {
      this.mascot.celebrate(1500);
      this.runStep(this.currentStepIndex + 1);
    }

    prevStep() {
      if (this.currentStepIndex > 0) {
        this.runStep(this.currentStepIndex - 1);
      }
    }

    repeatCurrentStep() {
      this.runStep(this.currentStepIndex);
    }

    switchLanguage(langCode) {
      this.currentLanguage = langCode;
      this.speech.setLanguage(langCode);
      this.bubble.setLanguage(langCode);
      this._saveLangPreference(langCode);
      this.repeatCurrentStep();
    }

    _showCompletionState() {
      this.highlighter.clear();
      this.bubble.setHighlightedTargetRect(null);
      this.mascot.moveToCorner();
      this.mascot.celebrate(2500);
      const doneText = this.currentLanguage === 'hi'
        ? 'इस गाइड के सभी चरण पूरे हो गए हैं! यदि आपको कोई चरण दोबारा देखना है, तो आप "पीछे" पर क्लिक कर सकते हैं।'
        : 'All steps in this guide are complete! You can click "Back" if you need to revisit any step.';
      const title = this.currentFlow.name ? this._resolveLocalizedText(this.currentFlow.name) : 'GovGuide';
      this.bubble.setContent(doneText, title, this.currentStepIndex, this.currentStepIndex + 1, true, this.currentLanguage);
      this.bubble.positionNear(this.mascot.currentX, this.mascot.currentY, 90, 90);
    }

    async _loadLangPreference() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get([PREF_LANG_KEY], (res) => {
            resolve(res[PREF_LANG_KEY] || null);
          });
        } else {
          resolve(localStorage.getItem(PREF_LANG_KEY));
        }
      });
    }

    _saveLangPreference(lang) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [PREF_LANG_KEY]: lang });
      } else {
        localStorage.setItem(PREF_LANG_KEY, lang);
      }
    }

    async _loadSessionProgress() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
          chrome.storage.session.get([SESSION_PROGRESS_KEY], (res) => {
            resolve(res[SESSION_PROGRESS_KEY] || null);
          });
        } else {
          resolve(null);
        }
      });
    }

    _saveSessionProgress() {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
        chrome.storage.session.set({
          [SESSION_PROGRESS_KEY]: {
            flowId: this.currentFlow ? this.currentFlow.flowId : null,
            pageId: this.currentPage ? this.currentPage.pageId : null
          }
        });
      }
    }
  }

  window.GovGuideStepRunner = StepRunner;
})();
