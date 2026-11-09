/**
 * GovGuide - Element Finder
 * Resilient multi-tier selector engine.
 * Never throws an unhandled error: safely catches all invalid CSS selectors,
 * missing IDs, or text mismatches and gracefully returns null.
 */
(function() {
  class ElementFinder {
    /**
     * Resolves an element using fallbacks in priority order:
     * 1. ID lookup
     * 2. CSS Selector query
     * 3. Visible text search (XPath / text match)
     * 4. Relative to container if provided
     * 
     * @param {Object} target Target descriptor from step guide
     * @returns {HTMLElement|null}
     */
    static find(target) {
      if (!target) return null;

      // 1. Element ID lookup
      if (target.id && typeof target.id === 'string' && !target.id.startsWith('TODO:')) {
        try {
          const el = document.getElementById(target.id);
          if (el && ElementFinder.isVisible(el)) {
            return el;
          }
        } catch (e) {
          // ignore error
        }
      }

      // 2. Standard CSS selector query
      if (target.css && typeof target.css === 'string' && !target.css.startsWith('TODO:')) {
        try {
          const el = document.querySelector(target.css);
          if (el && ElementFinder.isVisible(el)) {
            return el;
          }
        } catch (err) {
          // Gracefully caught invalid or non-standard CSS selector
        }
      }

      // 3. Visible text search
      if (target.textMatch && typeof target.textMatch === 'string' && !target.textMatch.startsWith('TODO:')) {
        const el = ElementFinder.findByText(target.textMatch);
        if (el) {
          return el;
        }
      }

      // 4. Relative positioning / relativeTo container
      if (target.relativeTo && typeof target.relativeTo === 'string' && !target.relativeTo.startsWith('TODO:')) {
        try {
          const parent = document.querySelector(target.relativeTo);
          if (parent) {
            const firstInteractable = parent.querySelector('button, input, select, a');
            if (firstInteractable && ElementFinder.isVisible(firstInteractable)) {
              return firstInteractable;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      return null;
    }

    /**
     * Finds visible elements containing the specified text.
     */
    static findByText(text) {
      if (!text) return null;
      const cleanText = text.trim().toLowerCase();

      // Priority elements: buttons, links, labels, spans, headings
      const candidates = document.querySelectorAll('button, a, label, h1, h2, h3, h4, h5, h6, select, div, p, span');
      for (const el of candidates) {
        if (!ElementFinder.isVisible(el)) continue;
        const directText = el.textContent || '';
        if (directText.toLowerCase().includes(cleanText)) {
          // Ensure it's not a huge container with pages of text
          if (directText.trim().length <= cleanText.length + 50) {
            return el;
          }
        }
      }
      return null;
    }

    /**
     * Checks if element is visible and rendered in viewport
     */
    static isVisible(el) {
      if (!el || !el.getBoundingClientRect) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }
  }

  window.GovGuideElementFinder = ElementFinder;
})();
