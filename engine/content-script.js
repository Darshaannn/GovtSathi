/**
 * GovGuide - Content Script Entry Point
 * Detects current URL against the site registry, loads the appropriate JSON guide,
 * and boots the mascot engine in the top frame only.
 */
(async function() {
  // Prevent duplicate injection or running inside subframes
  if (window !== window.top) {
    // Mount mascot exclusively in top window frame
    return;
  }

  if (window.__govguide_initialized) return;
  window.__govguide_initialized = true;

  function matchesUrl(pattern, url) {
    if (pattern === '<all_urls>') return true;
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp('^' + regexPattern + '$', 'i').test(url);
  }

  async function fetchJson(resourcePath) {
    let url = resourcePath;
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      url = chrome.runtime.getURL(resourcePath);
    }
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to load ${resourcePath}`);
    }
    return await resp.json();
  }

  async function init() {
    try {
      const currentUrl = window.location.href;
      const registry = await fetchJson('guides/registry.json');
      if (!registry || !registry.sites) return;

      // Find matching site in registry
      let matchedSite = null;
      for (const site of registry.sites) {
        if (site.urlPatterns && site.urlPatterns.some(p => matchesUrl(p, currentUrl))) {
          matchedSite = site;
          break;
        }
      }

      if (!matchedSite) {
        return; // Current page is not a registered guide target
      }

      // Load specific site guide JSON
      const guideData = await fetchJson(matchedSite.guidePath);
      if (!guideData) return;

      // Initialize UI in Shadow DOM
      const shadowMgr = new window.GovGuideShadowManager();
      const shadowRoot = shadowMgr.init();

      const highlighter = new window.GovGuideHighlighter(shadowRoot);
      const speech = new window.GovGuideSpeechService();

      let mascot = null;
      let bubble = null;
      let stepRunner = null;

      bubble = new window.GovGuideSpeechBubble(shadowRoot, {
        onNext: () => stepRunner.nextStep(),
        onPrev: () => stepRunner.prevStep(),
        onMuteToggle: () => {
          const isMuted = speech.toggleMute();
          bubble.setMutedState(isMuted);
        },
        onRepeat: () => stepRunner.repeatCurrentStep(),
        onMicToggle: () => speech.toggleListening(),
        onLangChange: (lang) => stepRunner.switchLanguage(lang),
        onMinimize: () => mascot.minimize()
      });

      mascot = new window.GovGuideMascotUI(shadowRoot, {
        onPositionChange: (x, y, w, h) => bubble.positionNear(x, y, w, h),
        onMinimizeToggled: (minimized) => {
          bubble.setVisible(!minimized);
          if (minimized) highlighter.clear();
          else stepRunner.repeatCurrentStep();
        }
      });

      // Wire speech callbacks
      speech.onListeningChange = (isListening) => {
        bubble.setListeningState(isListening);
      };

      speech.onIntentDetected = (phrase) => {
        stepRunner.matchVoiceIntent(phrase);
      };

      speech.onNoticeNeeded = (onConsentGranted) => {
        const lang = stepRunner.currentLanguage;
        const noticeText = lang === 'hi'
          ? "वॉयस इनपुट आपके ब्राउज़र की वाक् सेवा का उपयोग करता है, जो ब्राउज़र विक्रेता को ऑडियो भेज सकता है। पाठ और वॉयस आउटपुट आपके डिवाइस पर ही रहते हैं।"
          : "Voice input uses your browser's speech service, which may send audio to the browser vendor. Text and voice output stay on your device.";
        bubble.showNotice(noticeText, onConsentGranted, lang === 'hi' ? 'अनुमति दें और जारी रखें' : 'Allow & Continue');
      };

      stepRunner = new window.GovGuideStepRunner(guideData, shadowRoot, highlighter, mascot, bubble, speech);

      // Listen for language or control changes from extension popup
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
          if (msg && msg.type === 'GOVGUIDE_SET_LANGUAGE') {
            stepRunner.switchLanguage(msg.language);
            sendResponse({ status: 'ok' });
          } else if (msg && msg.type === 'GOVGUIDE_GET_STATUS') {
            sendResponse({
              status: 'active',
              siteId: matchedSite.id,
              siteName: matchedSite.name,
              language: stepRunner.currentLanguage
            });
          }
        });
      }

    } catch (err) {
      console.warn('[GovGuide] init notice:', err.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();