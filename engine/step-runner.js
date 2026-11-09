/**
 * GovGuide - Step Runner
 * State machine managing current flow, pages, steps, triggers, and language.
 * Strict Privacy & Safety: Listens ONLY to events (click/change) and NEVER inspects input values.
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
          log('Switching to page:', matchedPage.pageId);
          this.setPage(matchedPage);
        }
      } else {
        log('No page rule matched for URL:', currentUrl);
      }
    }

    setPage(page) {
      this.currentPage = page;
      this.currentStepIndex = 0;
      this._saveSessionProgress(this.currentFlow ? this.currentFlow.flowId : null, page.pageId);
      this.executeStep(0);
    }

    setFlow(flow) {
      this.currentFlow = flow;
      this.detectAndApplyPage();
    }

    executeStep(index) {
      if (!this.currentPage || !this.currentPage.steps) return;
      if (index < 0 || index >= this.currentPage.steps.length) {
        if (index >= this.currentPage.steps.length) {
          this._handleFlowComplete();
        }
        return;
      }

      const step = this.currentPage.steps[index];
      log('Executing step:', step.stepId, '(Order:', step.order, ')');

      // Check skipIfNotFound
      if (step.skipIfNotFound && step.target) {
        const testEl = window.GovGuideElementFinder.find(step.target);
        if (!testEl) {
          log('Step', step.stepId, 'has skipIfNotFound=true and target is missing. Skipping silently.');
          this.executeStep(index + 1);
          return;
        }
      }

      this._detachCurrentTrigger();
      this.currentStepIndex = index;
      const isLastStep = index === this.currentPage.steps.length - 1;

      // Safe Element Lookup (only if target specified and actionType is not explain_only)
      let targetElement = null;
      if (step.target && step.actionType !== 'explain_only') {
        targetElement = window.GovGuideElementFinder.find(step.target);
      }

      // Retrieve messages
      const lang = this.currentLanguage;
      const msgs = step.messages && step.messages[lang] ? step.messages[lang] : (step.messages?.en || {});
      const fallbackMsgs = step.fallback && step.fallback[lang] ? step.fallback[lang] : (step.fallback?.en || 'Please review this step.');
      const flowTitle = (this.currentFlow.name && this.currentFlow.name[lang]) || this.guide.name;

      if (step.actionType === 'explain_only' || !step.target) {
        // Explain-only mode: no spotlight, no highlight ring, mascot moves to corner
        this.highlighter.clear();
        this.mascot.moveToCorner();

        this.bubble.setContent(
          msgs.bubble || msgs.speech || 'Please follow this explanation.',
          flowTitle,
          index,
          this.currentPage.steps.length,
          isLastStep
        );

        this.speech.speak(msgs.speech || msgs.bubble);
      } else if (targetElement) {
        // Spotlight & ring
        this.highlighter.highlight(targetElement, true);
        this.mascot.moveToTarget(targetElement);

        this.bubble.setContent(
          msgs.bubble || msgs.speech || 'Follow this step.',
          flowTitle,
          index,
          this.currentPage.steps.length,
          isLastStep
        );

        this.speech.speak(msgs.speech || msgs.bubble);
        this._attachTrigger(step.stepDoneTrigger, targetElement);
      } else {
        // Fallback behavior: graceful notification without crash
        this.highlighter.clear();
        this.mascot.moveToCorner();

        this.bubble.setContent(
          fallbackMsgs,
          flowTitle,
          index,
          this.currentPage.steps.length,
          isLastStep
        );

        this.speech.speak(fallbackMsgs);
      }
    }

    /**
     * Attaches step-done triggers (click, change).
     * Strictly listens for the event occurrence ONLY — never reads target.value!
     */
    _attachTrigger(trigger, targetElement) {
      if (!trigger || trigger.type === 'manual_next') return;

      let el = targetElement;
      if (trigger.selector && !trigger.selector.startsWith('TODO:')) {
        try {
          const matched = document.querySelector(trigger.selector);
          if (matched) el = matched;
        } catch (e) {
          // ignore
        }
      }

      if (!el) return;

      const eventType = trigger.type === 'change' ? 'change' : 'click';
      const listener = () => {
        // Strictly event detection only, zero inspection of input values
        this._detachCurrentTrigger();
        // Advance to next step
        this.executeStep(this.currentStepIndex + 1);
      };

      el.addEventListener(eventType, listener, { once: true });
      this.currentEventElement = el;
      this.currentEventType = eventType;
      this.currentEventListener = listener;
    }

    _detachCurrentTrigger() {
      if (this.currentEventElement && this.currentEventType && this.currentEventListener) {
        this.currentEventElement.removeEventListener(this.currentEventType, this.currentEventListener);
      }
      this.currentEventElement = null;
      this.currentEventType = null;
      this.currentEventListener = null;
    }

    nextStep() {
      if (!this.currentPage || !this.currentPage.steps) return;
      if (this.currentStepIndex < this.currentPage.steps.length - 1) {
        this.executeStep(this.currentStepIndex + 1);
      } else {
        this._handleFlowComplete();
      }
    }

    prevStep() {
      if (this.currentStepIndex > 0) {
        this.executeStep(this.currentStepIndex - 1);
      }
    }

    repeatCurrentStep() {
      this.executeStep(this.currentStepIndex);
    }

    async switchLanguage(langCode) {
      this.currentLanguage = langCode;
      this.bubble.setLanguage(langCode);
      this.speech.setLanguage(langCode);
      await this._saveLangPreference(langCode);
      this.executeStep(this.currentStepIndex);
    }

    matchVoiceIntent(phrase) {
      if (!phrase || !this.guide.flows) return false;
      const cleanPhrase = phrase.toLowerCase();

      for (const flow of this.guide.flows) {
        if (!flow.keywords) continue;
        const matched = flow.keywords.some(kw => cleanPhrase.includes(kw.toLowerCase()));
        if (matched) {
          this.setFlow(flow);
          return true;
        }
      }

      // If no flow keyword matched, give feedback
      const notice = this.currentLanguage === 'hi'
        ? `"${phrase}" के लिए कोई गाइड नहीं मिला।`
        : `No guide flow found for "${phrase}".`;
      this.bubble.showNotice(notice);
      setTimeout(() => this.bubble.hideNotice(), 4000);
      return false;
    }

    _handleFlowComplete() {
      this.highlighter.clear();
      this.mascot.moveToCorner();
      const doneText = this.currentLanguage === 'hi'
        ? 'इस गाइड के सभी चरण पूरे हो गए हैं। यदि आवश्यक हो तो आप "Back" दबा सकते हैं।'
        : 'All steps in this guide are complete! You can click "Back" if you need to revisit any step.';
      const title = (this.currentFlow && this.currentFlow.name && this.currentFlow.name[this.currentLanguage]) || this.guide.name;
      this.bubble.setContent(doneText, title, this.currentPage.steps.length - 1, this.currentPage.steps.length, true);
      this.speech.speak(doneText);
    }

    async _loadLangPreference() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get([PREF_LANG_KEY], (res) => {
            resolve(res[PREF_LANG_KEY]);
          });
        } else {
          resolve(localStorage.getItem(PREF_LANG_KEY));
        }
      });
    }

    async _saveLangPreference(langCode) {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ [PREF_LANG_KEY]: langCode }, () => resolve());
        } else {
          localStorage.setItem(PREF_LANG_KEY, langCode);
          resolve();
        }
      });
    }

    async _loadSessionProgress() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
          chrome.storage.session.get([SESSION_PROGRESS_KEY], (res) => {
            resolve(res[SESSION_PROGRESS_KEY]);
          });
        } else {
          try {
            const data = sessionStorage.getItem(SESSION_PROGRESS_KEY);
            resolve(data ? JSON.parse(data) : null);
          } catch (e) {
            resolve(null);
          }
        }
      });
    }

    async _saveSessionProgress(flowId, pageId) {
      // Strictly stores only flowId and pageId identifiers, never form values
      const data = { flowId, pageId };
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
          chrome.storage.session.set({ [SESSION_PROGRESS_KEY]: data }, () => resolve());
        } else {
          try {
            sessionStorage.setItem(SESSION_PROGRESS_KEY, JSON.stringify(data));
          } catch (e) {}
          resolve();
        }
      });
    }
  }

  window.GovGuideStepRunner = StepRunner;
})();