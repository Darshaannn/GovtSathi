/**
 * GovGuide - Step Runner
 * State machine managing current flow, pages, steps, triggers, and language.
 * Upgraded Features:
 * - Robust Fallback to English on missing translation keys (never blank or undefined)
 * - Safe pre-recorded audio playback handling (`step.audio[lang]`)
 * - Mascot speaking animation synchronization
 * - Notice presentation when language voice is not supported on user's device
 * - Persisted language & session state
 * - Strict Privacy & Safety: Listens ONLY to events (click/change) and NEVER inspects input values.
 */
(function() {
  const PREF_LANG_KEY = 'govguide_user_lang_pref';
  const SESSION_PROGRESS_KEY = 'govguide_session_progress';

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

      // Immediate synchronous detection
      this.detectAndApplyPage();
      this._setupDomObserver();

      // Asynchronous initialization of preferences and session state
      this._initAsync();
    }

    async _initAsync() {
      // Load saved language preference
      const savedLang = await this._loadLangPreference();
      if (savedLang) {
        this.currentLanguage = savedLang;
        this.bubble.setLanguage(this.currentLanguage);
        this.speech.setLanguage(this.currentLanguage);
      }

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
        // Explain only: no spotlight, position mascot in corner
        this.highlighter.clear();
        this.bubble.setHighlightedTargetRect(null);
        this.mascot.moveToCorner();
        this.bubble.setContent(messages.bubble, title, index, this.currentPage.steps.length, isLast, this.currentLanguage);
        this.bubble.positionNear(this.mascot.currentX, this.mascot.currentY, 90, 90);
        this.speech.speak(messages.speech, { audioUrl });
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
        // Target element not found: graceful fallback
        log('Target element not found for step:', step.stepId);
        this.highlighter.clear();
        this.bubble.setHighlightedTargetRect(null);
        this.mascot.moveToCorner();
        const displayMsg = fallbackText || messages.bubble;
        this.bubble.setContent(displayMsg, title, index, this.currentPage.steps.length, isLast, this.currentLanguage);
        this.bubble.positionNear(this.mascot.currentX, this.mascot.currentY, 90, 90);
        this.speech.speak(displayMsg, { audioUrl });
      }
    }

    _resolveStepMessage(messagesObj) {
      if (!messagesObj) {
        return { speech: '', bubble: '' };
      }
      const langMsg = messagesObj[this.currentLanguage];
      if (langMsg && (langMsg.bubble || langMsg.speech)) {
        return {
          speech: langMsg.speech || langMsg.bubble || '',
          bubble: langMsg.bubble || langMsg.speech || ''
        };
      }
      // Fallback to English
      const enMsg = messagesObj.en || {};
      return {
        speech: enMsg.speech || enMsg.bubble || '',
        bubble: enMsg.bubble || enMsg.speech || ''
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
        setTimeout(() => this.nextStep(), 400);
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
