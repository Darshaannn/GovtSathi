/**
 * GovGuide - Popup Script
 * Handles language persistence, voice picker, speech rate, text size, and test preview.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const PREF_LANG_KEY = 'govguide_user_lang_pref';
  const PREF_VOICE_KEY = 'govguide_selected_voice_uri';
  const PREF_SPEED_KEY = 'govguide_speech_speed_pref';
  const PREF_TEXT_SIZE_KEY = 'govguide_text_size_pref';

  const langSelect = document.getElementById('languageSelect');
  const voiceSelect = document.getElementById('voiceSelect');
  const voiceHintBox = document.getElementById('voiceHintBox');
  const testVoiceBtn = document.getElementById('testVoiceBtn');
  const speedSelect = document.getElementById('speedSelect');
  const textSizeSelect = document.getElementById('textSizeSelect');
  const siteNameEl = document.getElementById('currentSiteName');
  const statusBadge = document.getElementById('guideStatus');

  let currentLang = 'en';
  let savedVoiceURI = '';

  // Load preferences from storage
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([PREF_LANG_KEY, PREF_VOICE_KEY, PREF_SPEED_KEY, PREF_TEXT_SIZE_KEY], (res) => {
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

      if (response.status === 'active') {
        siteNameEl.textContent = response.siteName || 'Government Portal';
        statusBadge.textContent = 'Active';
        statusBadge.style.background = '#dcfce7';
        statusBadge.style.color = '#15803d';

        if (response.language) {
          langSelect.value = response.language;
          populateVoices(response.language);
        }
      }
    });
  });

  // Language Change Listener
  langSelect.addEventListener('change', (e) => {
    const newLang = e.target.value;
    currentLang = newLang;
    chrome.storage.local.set({ [PREF_LANG_KEY]: newLang });
    populateVoices(newLang);

    // Notify active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'GOVGUIDE_SET_LANGUAGE',
          language: newLang
        });
      }
    });
  });

  // Voice Selection Listener
  voiceSelect.addEventListener('change', (e) => {
    const selectedURI = e.target.value;
    savedVoiceURI = selectedURI;
    chrome.storage.local.set({ [PREF_VOICE_KEY]: selectedURI });
  });

  // Speed Selection Listener
  speedSelect.addEventListener('change', (e) => {
    const speed = e.target.value;
    chrome.storage.local.set({ [PREF_SPEED_KEY]: speed });
  });

  // Text Size Listener
  textSizeSelect.addEventListener('change', (e) => {
    const size = e.target.value;
    chrome.storage.local.set({ [PREF_TEXT_SIZE_KEY]: size });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'GOVGUIDE_SET_TEXT_SIZE',
          textSize: size
        });
      }
    });
  });

  // Test Voice Preview
  testVoiceBtn.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const sampleTexts = {
      en: 'Welcome to GovGuide. I am here to assist you step by step.',
      hi: 'GovGuide में आपका स्वागत है। मैं हर कदम पर आपकी सहायता करूँगा।',
      mr: 'GovGuide मध्ये आपले स्वागत आहे. मी आपल्याला मार्गदर्शन करेन.',
      gu: 'GovGuide માં તમારું સ્વાગત છે. હું દરેક પગલે તમારી મદદ કરીશ.',
      bn: 'GovGuide এ আপনাকে স্বাগতম। আমি প্রতিটি পদক্ষেপে আপনাকে সাহায্য করব।',
      ta: 'GovGuide-க்கு உங்களை வரவேற்கிறோம். நான் உங்களுக்கு உதவுவேன்.',
      te: 'GovGuide కు స్వాగతం. నేను ప్రతి దశలో మీకు సహాయం చేస్తాను.',
      kn: 'GovGuide ಗೆ ಸುಸ್ವಾಗತ. ನಾನು ನಿಮಗೆ ಹಂತ ಹಂತವಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.',
      ml: 'GovGuide-ലേക്ക് സ്വാഗതം. ഞാൻ ഓരോ ഘട്ടത്തിലും സഹായിക്കും.',
      pa: 'GovGuide ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਮੈਂ ਹਰ ਕਦਮ \'ਤੇ ਤੁਹਾਡੀ ਮਦਦ ਕਰਾਂਗਾ।',
      or: 'GovGuide ରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ। ମୁଁ ପ୍ରତ୍ୟେକ ପଦକ୍ଷେପରେ ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିବି।'
    };

    const textToSpeak = sampleTexts[langSelect.value] || sampleTexts.en;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    const speed = speedSelect.value;
    utterance.rate = speed === 'slow' ? 0.85 : (speed === 'fast' ? 1.2 : 1.0);

    const voices = window.speechSynthesis.getVoices() || [];
    if (voiceSelect.value) {
      const chosen = voices.find(v => v.voiceURI === voiceSelect.value);
      if (chosen) utterance.voice = chosen;
    } else {
      const langPrefix = langSelect.value.toLowerCase();
      const matched = voices.find(v => (v.lang || '').toLowerCase().startsWith(langPrefix));
      if (matched) utterance.voice = matched;
    }

    window.speechSynthesis.speak(utterance);
  });
});
