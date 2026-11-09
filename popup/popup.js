/**
 * GovGuide - Popup Script
 * Handles language persistence and active tab communication.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const PREF_LANG_KEY = 'govguide_user_lang_pref';
  const langSelect = document.getElementById('languageSelect');
  const siteNameEl = document.getElementById('currentSiteName');
  const statusBadge = document.getElementById('guideStatus');

  // Load stored language preference
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([PREF_LANG_KEY], (res) => {
      if (res[PREF_LANG_KEY]) {
        langSelect.value = res[PREF_LANG_KEY];
      }
    });
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
        }
      }
    });
  });

  // Handle user changing language in popup
  langSelect.addEventListener('change', (e) => {
    const newLang = e.target.value;

    // Save preference
    chrome.storage.local.set({ [PREF_LANG_KEY]: newLang });

    // Inform active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'GOVGUIDE_SET_LANGUAGE',
          language: newLang
        });
      }
    });
  });
});
