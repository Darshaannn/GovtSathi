/**
 * GovGuide - Speech Service
 * Handles native Browser Text-To-Speech (SpeechSynthesis)
 * and opt-in Browser Speech-To-Text (SpeechRecognition) for intent matching.
 * 
 * Safety & Privacy Rule:
 * - Speech synthesis runs entirely offline on-device.
 * - Speech recognition is strictly opt-in with a one-time notice before first use.
 * - Auto-stops after 1 recognized utterance or ~8 seconds of silence.
 */
(function() {
  const CONSENT_STORAGE_KEY = 'govguide_mic_opt_in_consent';

  class SpeechService {
    constructor() {
      this.isMuted = false;
      this.recognition = null;
      this.isListening = false;
      this.silenceTimeout = null;
      this.onIntentDetected = null;
      this.onListeningChange = null;
      this.onNoticeNeeded = null;
      this.currentUtterance = null;
      this.currentLang = 'en';

      this._initRecognition();
    }

    _initRecognition() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        return;
      }

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

      this.recognition.onerror = (e) => {
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
      if (this.recognition) {
        this.recognition.lang = langCode === 'hi' ? 'hi-IN' : 'en-IN';
      }
    }

    speak(text) {
      if (this.isMuted || !text || !('speechSynthesis' in window)) {
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.currentLang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.95; // Slightly slower for clarity
      utterance.pitch = 1.0;

      // Select voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const langPrefix = this.currentLang === 'hi' ? 'hi' : 'en';
        const matchedVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    }

    stopSpeaking() {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
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

      // Check opt-in consent requirement
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
        this.recognition.lang = this.currentLang === 'hi' ? 'hi-IN' : 'en-IN';
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
        } catch (e) {
          // ignore
        }
      }
      this.isListening = false;
      this._notifyListeningChange(false);
    }

    _startSilenceTimer() {
      this._clearSilenceTimer();
      // Auto-stop after ~8 seconds of silence
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
