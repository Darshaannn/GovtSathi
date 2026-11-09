/**
 * GovGuide - Speech Service
 * Upgraded Features:
 * - Smart Voice Ranking & Selection (exact locale match, neural/natural/online voices first)
 * - Asynchronous voice initialization (`voiceschanged` lifecycle)
 * - Speech rate control (slow: 0.85, normal: 1.0, fast: 1.2) persisted to storage
 * - Natural text parsing (strips URLs/symbols, chunks into short human phrases with gentle pauses)
 * - Audio playback support for pre-recorded step audio (`step.audio[lang]`) with fallback to TTS
 * - Speaking state callbacks (triggers mascot speaking animation)
 * - Fallback polite notice when no voice exists on the user's OS
 */
(function() {
  const CONSENT_STORAGE_KEY = 'govguide_mic_opt_in_consent';
  const PREF_SPEED_KEY = 'govguide_speech_speed_pref';
  const PREF_VOICE_KEY = 'govguide_selected_voice_uri';

  class SpeechService {
    constructor() {
      this.isMuted = false;
      this.recognition = null;
      this.isListening = false;
      this.silenceTimeout = null;
      this.currentLang = 'en';
      this.currentSpeed = 'normal'; // 'slow' | 'normal' | 'fast'
      this.selectedVoiceURI = null;
      this.currentAudio = null;

      this.onIntentDetected = null;
      this.onListeningChange = null;
      this.onNoticeNeeded = null;
      this.onSpeakingChange = null;
      this.onNoVoiceAvailable = null;

      this._availableVoices = [];
      this._initVoices();
      this._initRecognition();
      this._loadStoredPreferences();
    }

    _initVoices() {
      if (!('speechSynthesis' in window)) return;

      const updateVoices = () => {
        this._availableVoices = window.speechSynthesis.getVoices() || [];
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }

    async _loadStoredPreferences() {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([PREF_SPEED_KEY, PREF_VOICE_KEY], (res) => {
          if (res[PREF_SPEED_KEY]) this.currentSpeed = res[PREF_SPEED_KEY];
          if (res[PREF_VOICE_KEY]) this.selectedVoiceURI = res[PREF_VOICE_KEY];
        });
      }
    }

    _initRecognition() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this._notifyListeningChange(true);
        this._startSilenceTimer();
      };

      this.recognition.onresult = (event) => {
        this._clearSilenceTimer();
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript.trim();
          if (this.onIntentDetected) {
            this.onIntentDetected(transcript);
          }
        }
        this.stopListening();
      };

      this.recognition.onerror = () => {
        this._clearSilenceTimer();
        this.isListening = false;
        this._notifyListeningChange(false);
      };

      this.recognition.onend = () => {
        this._clearSilenceTimer();
        this.isListening = false;
        this._notifyListeningChange(false);
      };
    }

    setLanguage(langCode) {
      this.currentLang = langCode;
      const langMeta = (window.GovGuideLanguages && window.GovGuideLanguages.LanguageRegistry)
        ? window.GovGuideLanguages.LanguageRegistry.get(langCode)
        : null;
      const locale = langMeta ? langMeta.ttsLocale : (langCode === 'hi' ? 'hi-IN' : 'en-IN');

      if (this.recognition) {
        this.recognition.lang = locale;
      }
    }

    setSpeed(speed) {
      if (!['slow', 'normal', 'fast'].includes(speed)) speed = 'normal';
      this.currentSpeed = speed;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [PREF_SPEED_KEY]: speed });
      }
    }

    setSelectedVoice(voiceURI) {
      this.selectedVoiceURI = voiceURI;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [PREF_VOICE_KEY]: voiceURI });
      }
    }

    getRateMultiplier() {
      let base = 1.0;
      // Default rate about 0.95 for English to keep a calm, gentle pace
      if (this.currentLang === 'en') {
        base = 0.95;
      }

      switch (this.currentSpeed) {
        case 'slow': return +(base * 0.85).toFixed(2);
        case 'fast': return +(base * 1.25).toFixed(2);
        case 'normal':
        default: return base;
      }
    }

    /**
     * Returns installed voices matching language ranked by quality:
     * For English:
     * 1. en-IN female natural/neural/online (e.g. Neerja, Heera, Veena, Google India English, etc.)
     * 2. Other en-IN voices
     * 3. Other English female natural/neural voices (en-GB/en-US, etc.)
     * 4. Other natural/neural voices
     * 5. The rest of matching English voices
     *
     * For other languages:
     * 1. Exact locale match (e.g. hi-IN over hi)
     * 2. Natural / Neural / Online in name
     * 3. Prefix locale match
     */
    getVoicesForLanguage(langCode) {
      if (!('speechSynthesis' in window)) return [];
      const voices = window.speechSynthesis.getVoices() || this._availableVoices;
      const langMeta = (window.GovGuideLanguages && window.GovGuideLanguages.LanguageRegistry)
        ? window.GovGuideLanguages.LanguageRegistry.get(langCode)
        : null;
      const targetLocale = (langMeta ? langMeta.ttsLocale : langCode).toLowerCase();
      const prefix = langCode.toLowerCase();

      if (prefix === 'en') {
        // Specialised high-priority ranking for English (calm Indian-English female voice)
        const enVoices = voices.filter(v => {
          const vLang = (v.lang || '').toLowerCase().replace(/_/g, '-');
          return vLang.startsWith('en');
        });

        const femaleNames = ['neerja', 'heera', 'veena', 'ananya', 'kavya', 'priya', 'aditi', 'zira', 'aria', 'jenny', 'sonia', 'samantha', 'victoria'];
        const isFemaleOrNaturalName = (name) => {
          const n = name.toLowerCase();
          return femaleNames.some(fn => n.includes(fn)) || n.includes('female') || n.includes('woman');
        };

        return enVoices.sort((a, b) => {
          const score = (v) => {
            let s = 0;
            const vLang = (v.lang || '').toLowerCase().replace(/_/g, '-');
            const vName = (v.name || '').toLowerCase();
            const isIndian = vLang === 'en-in' || vName.includes('india') || vName.includes('indian') || vName.includes('en-in');
            const isNatural = vName.includes('natural') || vName.includes('neural') || vName.includes('online') || !v.localService;
            const isFemale = isFemaleOrNaturalName(vName);

            // Tier 1: en-IN female natural/neural/online (e.g. Neerja, Heera, Veena, Google India English)
            if (isIndian && isFemale && isNatural) s += 1000;
            else if (isIndian && (isFemale || vName.includes('google') || vName.includes('microsoft'))) s += 700;
            else if (isIndian && isNatural) s += 600;
            else if (isIndian) s += 500; // Other en-IN voices
            else if (isFemale && isNatural) s += 300; // Other English female natural
            else if (isNatural) s += 200; // Other English natural
            else if (isFemale) s += 100; // Other English female
            else s += 50;

            if (vName.includes('neerja')) s += 400; // Neerja is top choice for calm Indian English
            else if (vName.includes('heera') || vName.includes('veena')) s += 300;
            if (vName.includes('natural') || vName.includes('neural')) s += 100;
            if (vName.includes('india english')) s += 250;
            return s;
          };
          return score(b) - score(a);
        });
      }

      const matched = voices.filter(v => {
        const vLang = (v.lang || '').toLowerCase().replace(/_/g, '-');
        return vLang === targetLocale || vLang.startsWith(prefix);
      });

      // Score and rank for non-English languages
      return matched.sort((a, b) => {
        const score = (voice) => {
          let s = 0;
          const vLang = (voice.lang || '').toLowerCase().replace(/_/g, '-');
          const vName = (voice.name || '').toLowerCase();
          if (vLang === targetLocale) s += 100;
          if (vName.includes('natural') || vName.includes('neural') || vName.includes('online')) s += 50;
          if (!voice.localService) s += 20; // Online browser vendor voices usually sound higher quality
          return s;
        };
        return score(b) - score(a);
      });
    }

    /**
     * Pre-processes text into human-sounding phrasing:
     * - Strips URLs and raw web paths
     * - Cleans confusing symbols
     * - Omits the independent helper label
     */
    _prepareNaturalPhrasing(rawText) {
      if (!rawText) return '';
      let text = rawText
        .replace(/https?:\/\/\S+/gi, '') // Remove URLs
        .replace(/\b[a-zA-Z0-9_\-\.]+\.(?:do|html|jsp|php)\b/gi, '') // Remove filenames like stateSelectBean.do
        .replace(/["'“”‘’]/g, '') // Remove quotes
        .replace(/[\(\)\[\]\{\}]/g, ', ') // Soften parentheses into natural pauses
        .replace(/\s+/g, ' ')
        .trim();

      return text;
    }

    /**
     * Speaks instruction text or plays pre-recorded audio file.
     * @param {string} text Spoken instruction text
     * @param {Object} audioOptions Optional { audioUrl: string }
     */
    speak(text, audioOptions = {}) {
      if (this.isMuted) return;

      this.stopSpeaking();

      // 1. If step has pre-recorded audio for this language, try playing it first
      if (audioOptions && audioOptions.audioUrl) {
        let fullAudioUrl = audioOptions.audioUrl;
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
          if (!fullAudioUrl.startsWith('http') && !fullAudioUrl.startsWith('blob:') && !fullAudioUrl.startsWith('data:')) {
            fullAudioUrl = chrome.runtime.getURL(audioOptions.audioUrl);
          }
        }

        const played = this._playAudioFile(fullAudioUrl, () => {
          // On audio playback error (file missing or load failure), silently fallback to TTS
          this._speakTTS(text);
        });

        if (played) return;
      }

      // 2. Fall back to SpeechSynthesis
      this._speakTTS(text);
    }

    _speakTTS(text) {
      if (!('speechSynthesis' in window)) {
        if (this.onNoVoiceAvailable) this.onNoVoiceAvailable(this.currentLang);
        return;
      }

      const cleanText = this._prepareNaturalPhrasing(text);
      if (!cleanText) return;

      const voices = this.getVoicesForLanguage(this.currentLang);
      if (voices.length === 0) {
        // No voice available on device for this language
        if (this.onNoVoiceAvailable) {
          this.onNoVoiceAvailable(this.currentLang);
        }
        return;
      }

      // Choose preferred voice or best ranked
      let chosenVoice = null;
      if (this.selectedVoiceURI) {
        chosenVoice = voices.find(v => v.voiceURI === this.selectedVoiceURI);
      }
      if (!chosenVoice) {
        chosenVoice = voices[0];
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const langMeta = (window.GovGuideLanguages && window.GovGuideLanguages.LanguageRegistry)
        ? window.GovGuideLanguages.LanguageRegistry.get(this.currentLang)
        : null;
      utterance.lang = langMeta ? langMeta.ttsLocale : 'en-IN';
      utterance.voice = chosenVoice;
      utterance.rate = this.getRateMultiplier();
      // Calm, warm, slightly relaxed pitch (0.98 for calm human cadence in English)
      utterance.pitch = (this.currentLang === 'en') ? 0.98 : 1.0;

      utterance.onstart = () => {
        if (this.onSpeakingChange) this.onSpeakingChange(true);
      };
      utterance.onend = () => {
        if (this.onSpeakingChange) this.onSpeakingChange(false);
      };
      utterance.onerror = () => {
        if (this.onSpeakingChange) this.onSpeakingChange(false);
      };

      window.speechSynthesis.speak(utterance);
    }

    _playAudioFile(url, onErrorFallback) {
      try {
        const audio = new Audio(url);
        this.currentAudio = audio;
        audio.playbackRate = this.getRateMultiplier();

        audio.onplay = () => {
          if (this.onSpeakingChange) this.onSpeakingChange(true);
        };
        audio.onended = () => {
          if (this.onSpeakingChange) this.onSpeakingChange(false);
          this.currentAudio = null;
        };
        audio.onerror = () => {
          if (this.onSpeakingChange) this.onSpeakingChange(false);
          this.currentAudio = null;
          if (onErrorFallback) onErrorFallback();
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            if (this.onSpeakingChange) this.onSpeakingChange(false);
            this.currentAudio = null;
            if (onErrorFallback) onErrorFallback();
          });
        }
        return true;
      } catch (err) {
        if (this.onSpeakingChange) this.onSpeakingChange(false);
        this.currentAudio = null;
        if (onErrorFallback) onErrorFallback();
        return false;
      }
    }

    stopSpeaking() {
      if (this.currentAudio) {
        try {
          this.currentAudio.pause();
          this.currentAudio = null;
        } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (this.onSpeakingChange) {
        this.onSpeakingChange(false);
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.isMuted) {
        this.stopSpeaking();
      }
      return this.isMuted;
    }

    async toggleListening() {
      if (this.isListening) {
        this.stopListening();
        return;
      }

      const consentGiven = await this.hasMicConsent();
      if (!consentGiven) {
        if (this.onNoticeNeeded) {
          this.onNoticeNeeded(async () => {
            await this.grantMicConsent();
            this.startListening();
          });
          return;
        }
      }

      this.startListening();
    }

    startListening() {
      if (!this.recognition || this.isListening) return;

      this.stopSpeaking();
      try {
        const langMeta = (window.GovGuideLanguages && window.GovGuideLanguages.LanguageRegistry)
          ? window.GovGuideLanguages.LanguageRegistry.get(this.currentLang)
          : null;
        this.recognition.lang = langMeta ? langMeta.ttsLocale : 'en-IN';
        this.recognition.start();
      } catch (e) {
        this.isListening = false;
        this._notifyListeningChange(false);
      }
    }

    stopListening() {
      this._clearSilenceTimer();
      if (this.recognition && this.isListening) {
        try {
          this.recognition.stop();
        } catch (e) {}
      }
      this.isListening = false;
      this._notifyListeningChange(false);
    }

    _startSilenceTimer() {
      this._clearSilenceTimer();
      this.silenceTimeout = setTimeout(() => {
        this.stopListening();
      }, 8000);
    }

    _clearSilenceTimer() {
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }
    }

    _notifyListeningChange(isListening) {
      if (this.onListeningChange) {
        this.onListeningChange(isListening);
      }
    }

    async hasMicConsent() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get([CONSENT_STORAGE_KEY], (res) => {
            resolve(!!res[CONSENT_STORAGE_KEY]);
          });
        } else {
          resolve(localStorage.getItem(CONSENT_STORAGE_KEY) === 'true');
        }
      });
    }

    async grantMicConsent() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ [CONSENT_STORAGE_KEY]: true }, () => resolve());
        } else {
          localStorage.setItem(CONSENT_STORAGE_KEY, 'true');
          resolve();
        }
      });
    }
  }

  window.GovGuideSpeechService = SpeechService;
})();
