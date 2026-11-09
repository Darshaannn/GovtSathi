/**
 * GovGuide - Mascot UI Component
 * Handles the rendering, natural movement, dragging, idle floating,
 * speaking animation, and minimize/restore of the guide mascot.
 */
(function() {
  class MascotUI {
    constructor(shadowRoot, options = {}) {
      this.shadowRoot = shadowRoot;
      this.options = options;
      this.config = window.GovGuideMascotConfig || {
        type: 'svg',
        assetPath: 'assets/mascot-default.svg',
        defaultWidth: 90,
        defaultHeight: 90,
        name: 'Sathi'
      };

      this.container = null;
      this.restorePill = null;
      this.currentX = 40;
      this.currentY = 40;
      this.isMinimized = false;
      this.isSpeaking = false;
      this.onPositionChange = options.onPositionChange || (() => {});
      this.onMinimizeToggled = options.onMinimizeToggled || (() => {});

      this._buildUI();
      this._initDraggable();
    }

    _buildUI() {
      // Mascot element
      const mascot = document.createElement('div');
      mascot.className = 'govguide-mascot-container idle-bobbing';
      mascot.title = 'GovGuide Mascot (Drag to reposition)';
      mascot.setAttribute('role', 'img');
      mascot.setAttribute('aria-label', `${this.config.name} Guide Mascot`);

      const assetUrl = this._resolveAssetUrl(this.config.assetPath);
      mascot.innerHTML = `<img class="govguide-mascot-img" src="${assetUrl}" alt="${this.config.name}" draggable="false" />`;

      this.shadowRoot.appendChild(mascot);
      this.container = mascot;

      // Initial corner position (bottom-right area default)
      this.currentX = Math.max(20, window.innerWidth - this.config.defaultWidth - 380);
      this.currentY = Math.max(20, window.innerHeight - this.config.defaultHeight - 90);
      this._updateTransform();

      // Restore button pill for when minimized
      const pill = document.createElement('div');
      pill.className = 'govguide-restore-pill';
      pill.style.display = 'none';
      pill.setAttribute('role', 'button');
      pill.setAttribute('tabindex', '0');
      pill.setAttribute('aria-label', 'Restore GovGuide Companion');
      pill.innerHTML = `<span aria-hidden="true">🧭</span> <span>Open GovGuide</span>`;
      pill.addEventListener('click', () => this.restore());
      pill.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.restore();
        }
      });
      this.shadowRoot.appendChild(pill);
      this.restorePill = pill;
    }

    _resolveAssetUrl(relPath) {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL(relPath);
      }
      return relPath;
    }

    _updateTransform() {
      this.container.style.left = `${this.currentX}px`;
      this.container.style.top = `${this.currentY}px`;
      this.onPositionChange(this.currentX, this.currentY, this.config.defaultWidth, this.config.defaultHeight);
    }

    setSpeaking(speaking) {
      this.isSpeaking = !!speaking;
      if (this.isSpeaking) {
        this.container.classList.remove('idle-bobbing');
        this.container.classList.add('is-speaking');
      } else {
        this.container.classList.remove('is-speaking');
        this.container.classList.add('idle-bobbing');
      }
    }

    /**
     * Smoothly moves the mascot towards a target element to point at it.
     */
    moveToTarget(targetElement) {
      if (this.isMinimized || !targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      const mascotW = this.config.defaultWidth;
      const mascotH = this.config.defaultHeight;

      // Position mascot just to the left or top-left of the target element
      let destX = rect.left - mascotW - 16;
      let destY = rect.top - 10;

      // If too close to left edge, position on right
      if (destX < 15) {
        destX = rect.right + 16;
      }
      // Keep within viewport bounds
      destX = Math.max(10, Math.min(window.innerWidth - mascotW - 10, destX));
      destY = Math.max(10, Math.min(window.innerHeight - mascotH - 10, destY));

      this.currentX = Math.round(destX);
      this.currentY = Math.round(destY);
      this._updateTransform();
    }

    moveToCorner() {
      if (this.isMinimized) return;
      this.currentX = Math.max(20, window.innerWidth - this.config.defaultWidth - 380);
      this.currentY = Math.max(20, window.innerHeight - this.config.defaultHeight - 90);
      this._updateTransform();
    }

    _initDraggable() {
      let isDragging = false;
      let startX, startY, origX, origY;

      const onMouseDown = (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        origX = this.currentX;
        origY = this.currentY;
        this.container.style.transition = 'none'; // Instant drag response
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      const onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        this.currentX = Math.max(10, Math.min(window.innerWidth - this.config.defaultWidth - 10, origX + dx));
        this.currentY = Math.max(10, Math.min(window.innerHeight - this.config.defaultHeight - 10, origY + dy));
        this._updateTransform();
      };

      const onMouseUp = () => {
        isDragging = false;
        this.container.style.transition = ''; // Restore smooth CSS transition
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      this.container.addEventListener('mousedown', onMouseDown);

      // Touch events for mobile/touch screens
      this.container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          isDragging = true;
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          origX = this.currentX;
          origY = this.currentY;
          this.container.style.transition = 'none';
        }
      }, { passive: true });

      this.container.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        this.currentX = Math.max(10, Math.min(window.innerWidth - this.config.defaultWidth - 10, origX + dx));
        this.currentY = Math.max(10, Math.min(window.innerHeight - this.config.defaultHeight - 10, origY + dy));
        this._updateTransform();
      }, { passive: true });

      this.container.addEventListener('touchend', () => {
        isDragging = false;
        this.container.style.transition = '';
      });
    }

    minimize() {
      this.isMinimized = true;
      this.container.style.display = 'none';
      this.restorePill.style.display = 'flex';
      this.onMinimizeToggled(true);
    }

    restore() {
      this.isMinimized = false;
      this.container.style.display = 'block';
      this.restorePill.style.display = 'none';
      this._updateTransform();
      this.onMinimizeToggled(false);
    }
  }

  window.GovGuideMascotUI = MascotUI;
})();
