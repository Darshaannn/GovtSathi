/**
 * GovGuide - Mascot UI Component
 * Handles the rendering, movement, dragging, and minimize/restore of the guide mascot.
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

      const assetUrl = this._resolveAssetUrl(this.config.assetPath);
      mascot.innerHTML = `<img class="govguide-mascot-img" src="${assetUrl}" alt="${this.config.name}" draggable="false" />`;

      this.shadowRoot.appendChild(mascot);
      this.container = mascot;

      // Initial corner position (bottom-right area default)
      this.currentX = Math.max(20, window.innerWidth - this.config.defaultWidth - 360);
      this.currentY = Math.max(20, window.innerHeight - this.config.defaultHeight - 80);
      this._updateTransform();

      // Restore button pill for when minimized
      const pill = document.createElement('div');
      pill.className = 'govguide-restore-pill';
      pill.style.display = 'none';
      pill.innerHTML = `<span>🧭</span> <span>Open GovGuide</span>`;
      pill.addEventListener('click', () => this.restore());
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

    /**
     * Smoothly moves the mascot towards a target element to point at it.
     */
    moveToTarget(targetElement) {
      if (this.isMinimized || !targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      const mascotW = this.config.defaultWidth;
      const mascotH = this.config.defaultHeight;

      // Position mascot just to the left or top-left of the target element
      let destX = rect.left - mascotW - 14;
      let destY = rect.top - 10;

      // If too close to left edge, position on right
      if (destX < 15) {
        destX = rect.right + 14;
      }
      // Keep within viewport bounds
      destX = Math.max(10, Math.min(window.innerWidth - mascotW - 10, destX));
      destY = Math.max(10, Math.min(window.innerHeight - mascotH - 10, destY));

      this.currentX = destX;
      this.currentY = destY;
      this._updateTransform();
    }

    moveToCorner() {
      if (this.isMinimized) return;
      this.currentX = Math.max(20, window.innerWidth - this.config.defaultWidth - 360);
      this.currentY = Math.max(20, window.innerHeight - this.config.defaultHeight - 90);
      this._updateTransform();
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

    _initDraggable() {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initialLeft = 0;
      let initialTop = 0;

      this.container.addEventListener('mousedown', (e) => {
        isDragging = true;
        this.container.classList.remove('idle-bobbing');
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = this.currentX;
        initialTop = this.currentY;
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        this.currentX = Math.max(5, Math.min(window.innerWidth - this.config.defaultWidth - 5, initialLeft + dx));
        this.currentY = Math.max(5, Math.min(window.innerHeight - this.config.defaultHeight - 5, initialTop + dy));
        this._updateTransform();
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          this.container.classList.add('idle-bobbing');
        }
      });
    }
  }

  window.GovGuideMascotUI = MascotUI;
})();
