/**
 * GovGuide - Popup Script
 * Handles language persistence, voice picker, speech rate, text size, inactivity nudge toggle, and test preview.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const PREF_LANG_KEY = 'govguide_user_lang_pref';
  const PREF_VOICE_KEY = 'govguide_selected_voice_uri';
  const PREF_SPEED_KEY = 'govguide_speech_speed_pref';
  const PREF_TEXT_SIZE_KEY = 'govguide_text_size_pref';
  const PREF_NUDGE_KEY = 'govguide_nudge_enabled';

  const langSelect = document.getElementById('languageSelect');
  const voiceSelect = document.getElementById('voiceSelect');
  const voiceHintBox = document.getElementById('voiceHintBox');
  const testVoiceBtn = document.getElementById('testVoiceBtn');
  const speedSelect = document.getElementById('speedSelect');
  const textSizeSelect = document.getElementById('textSizeSelect');
  const nudgeToggle = document.getElementById('nudgeToggle');
  const siteNameEl = document.getElementById('currentSiteName');
  const statusBadge = document.getElementById('guideStatus');

  let currentLang = 'en';
  let savedVoiceURI = '';

  // Load preferences from storage
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([PREF_LANG_KEY, PREF_VOICE_KEY, PREF_SPEED_KEY, PREF_TEXT_SIZE_KEY, PREF_NUDGE_KEY], (res) => {
      if (res[PREF_LANG_KEY]) {
        currentLang = res[PREF_LANG_KEY];
        langSelect.value = currentLang;
      }
      if (res[PREF_VOICE_KEY]) {
        savedVoiceURI = res[PREF_VOICE_KEY];
      }
      if (res[PREF_SPEED_KEY]) {
        speedSelect.value = res[PREF_SPEED_KEY];
      }
      if (res[PREF_TEXT_SIZE_KEY]) {
        textSizeSelect.value = res[PREF_TEXT_SIZE_KEY];
      }
      if (typeof res[PREF_NUDGE_KEY] === 'boolean') {
        nudgeToggle.checked = res[PREF_NUDGE_KEY];
      }
      populateVoices(currentLang);
    });
  } else {
    populateVoices(currentLang);
  }

  function populateVoices(langCode) {
    if (!('speechSynthesis' in window)) {
      voiceSelect.innerHTML = '<option value="">SpeechSynthesis not available</option>';
      if (voiceHintBox) voiceHintBox.style.display = 'none';
      return;
    }

    const voices = window.speechSynthesis.getVoices() || [];
    const langPrefix = langCode.toLowerCase();

    // Check if we have specialized engine ranking logic or match exact
    let matched = [];
    if (langPrefix === 'en') {
      const femaleNames = ['neerja', 'heera', 'veena', 'ananya', 'kavya', 'priya', 'aditi', 'zira', 'aria', 'jenny', 'sonia', 'samantha', 'victoria'];
      const isFemale = (n) => femaleNames.some(fn => n.toLowerCase().includes(fn)) || n.toLowerCase().includes('female');

      matched = voices.filter(v => (v.lang || '').toLowerCase().replace(/_/g, '-').startsWith('en')).sort((a, b) => {
        const score = (v) => {
          let s = 0;
          const vLang = (v.lang || '').toLowerCase().replace(/_/g, '-');
          const vName = (v.name || '').toLowerCase();
          const isIndian = vLang === 'en-in' || vName.includes('india') || vName.includes('indian');
          const isNatural = vName.includes('natural') || vName.includes('neural') || vName.includes('online') || !v.localService;
          const fem = isFemale(vName);

          if (isIndian && fem && isNatural) s += 1000;
          else if (isIndian && (fem || vName.includes('google') || vName.includes('microsoft'))) s += 700;
          else if (isIndian && isNatural) s += 600;
          else if (isIndian) s += 500;
          else if (fem && isNatural) s += 300;
          else if (isNatural) s += 200;
          else if (fem) s += 100;
          else s += 50;

          if (vName.includes('neerja') || vName.includes('heera') || vName.includes('veena')) s += 300;
          return s;
        };
        return score(b) - score(a);
      });

      // Show hint if no Indian English voice is detected
      const hasIndianVoice = matched.some(v => {
        const vLang = (v.lang || '').toLowerCase().replace(/_/g, '-');
        const vName = (v.name || '').toLowerCase();
        return vLang === 'en-in' || vName.includes('india');
      });

      if (voiceHintBox) {
        voiceHintBox.style.display = hasIndianVoice ? 'none' : 'block';
      }
    } else {
      if (voiceHintBox) voiceHintBox.style.display = 'none';
      matched = voices.filter(v => {
        const vLang = (v.lang || '').toLowerCase().replace(/_/g, '-');
        return vLang.startsWith(langPrefix);
      });
    }

    voiceSelect.innerHTML = '';
    if (matched.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = `No voice available for (${langCode})`;
      opt.disabled = true;
      opt.selected = true;
      voiceSelect.appendChild(opt);
      return;
    }

    // Default Recommended option
    const recOpt = document.createElement('option');
    recOpt.value = '';
    const topVoiceName = matched[0] ? matched[0].name : 'Default';
    recOpt.textContent = `Recommended: ${topVoiceName}`;
    voiceSelect.appendChild(recOpt);

    matched.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.voiceURI;
      opt.textContent = `${v.name} (${v.lang})`;
      if (v.voiceURI === savedVoiceURI) {
        opt.selected = true;
      }
      voiceSelect.appendChild(opt);
    });
  }

  // Update voices on voiceschanged
  if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => populateVoices(langSelect.value);
  }

  // Query active tab status
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    const tabId = tabs[0].id;

    chrome.tabs.sendMessage(tabId, { type: 'GOVGUIDE_GET_STATUS' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        siteNameEl.textContent = 'No guide active on this tab';
        statusBadge.textContent = 'Inactive';
        statusBadge.style.background = '#f1f5f9';
        statusBadge.style.color = '#64748b';
        return;
      }

      siteNameEl.textContent = response.guideName || 'Active';
      statusBadge.textContent = response.pageTitle || 'Active';
      statusBadge.style.background = '#dcfce7';
      statusBadge.style.color = '#15803d';

      if (response.currentLanguage) {
        langSelect.value = response.currentLanguage;
        currentLang = response.currentLanguage;
        populateVoices(currentLang);
      }
    });
  });

  // Handle language switch
  langSelect.addEventListener('change', () => {
    currentLang = langSelect.value;
    savedVoiceURI = ''; // reset voice preference when switching language
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [PREF_LANG_KEY]: currentLang, [PREF_VOICE_KEY]: '' });
    }
    populateVoices(currentLang);

    // Broadcast to active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'GOVGUIDE_SET_LANGUAGE',
          language: currentLang
        });
      }
    });
  });

  // Handle voice selection
  voiceSelect.addEventListener('change', () => {
    savedVoiceURI = voiceSelect.value;
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [PREF_VOICE_KEY]: savedVoiceURI });
    }
  });

  // Handle speed selection
  speedSelect.addEventListener('change', () => {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [PREF_SPEED_KEY]: speedSelect.value });
    }
  });

  // Handle text size selection
  textSizeSelect.addEventListener('change', () => {
    const size = textSizeSelect.value;
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [PREF_TEXT_SIZE_KEY]: size });
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'GOVGUIDE_SET_TEXT_SIZE',
          textSize: size
        });
      }
    });
  });

  // Handle inactivity nudge toggle
  nudgeToggle.addEventListener('change', () => {
    const enabled = nudgeToggle.checked;
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [PREF_NUDGE_KEY]: enabled });
    }
  });

  // Voice Test preview
  testVoiceBtn.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const sampleTexts = {
      en: "Hello! I am your GovGuide assistant. I will help you step by step with official portal forms.",
      hi: "नमस्ते! मैं आपका GovGuide सहायक हूँ। मैं सरकारी पोर्टल फ़ॉर्म भरने में आपकी चरणबद्ध मदद करूँगा।",
      mr: "नमस्कार! मी तुमचा GovGuide साहाय्यक आहे.",
      gu: "નમસ્તે! હું તમારો GovGuide સહાયક છું.",
      bn: "নমস্কার! আমি আপনার GovGuide সহায়ক।",
      ta: "வணக்கம்! நான் உங்கள் GovGuide உதவியாளர்.",
      te: "నమస్కారం! నేను మీ GovGuide సహాయకుడిని.",
      kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ GovGuide ಸಹಾಯಕ.",
      ml: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ GovGuide സഹായിയാണ്.",
      pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ GovGuide ਸਹਾਇਕ ਹਾਂ।",
      or: "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର GovGuide ସହାୟକ।"
    };

    const textToSpeak = sampleTexts[currentLang] || sampleTexts.en;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Apply speed
    const rates = { slow: 0.85, normal: 1.0, fast: 1.2 };
    utterance.rate = rates[speedSelect.value] || 1.0;

    // Apply voice if selected
    const voices = window.speechSynthesis.getVoices() || [];
    if (voiceSelect.value) {
      const chosen = voices.find(v => v.voiceURI === voiceSelect.value);
      if (chosen) utterance.voice = chosen;
    } else {
      // Pick first matching
      const langPrefix = currentLang.toLowerCase();
      const chosen = voices.find(v => (v.lang || '').toLowerCase().replace(/_/g, '-').startsWith(langPrefix));
      if (chosen) utterance.voice = chosen;
    }

    testVoiceBtn.classList.add('testing');
    utterance.onend = () => testVoiceBtn.classList.remove('testing');
    utterance.onerror = () => testVoiceBtn.classList.remove('testing');

    window.speechSynthesis.speak(utterance);
  });
});
