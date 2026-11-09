/**
 * GovGuide - Highlighter & Spotlight
 * Creates a soft dim background with a transparent spotlight cutout and an animated pulse ring over target elements.
 * Critical: Clicks MUST cleanly pass through to the real page element (pointer-events: none).
 */
(function() {
  class Highlighter {
    constructor(shadowRoot) {
      this.shadowRoot = shadowRoot;
      this.svgElement = null;
      this.pulseRing = null;
      this.currentTarget = null;
      this._initElements();
      this._bindResize();
    }

    _initElements() {
      // SVG for spotlight mask
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'govguide-spotlight-svg');
      svg.innerHTML = `
        <defs>
          <mask id="govguide-spotlight-mask">
            <!-- White reveals the soft dim backdrop -->
            <rect x="0" y="0" width="100%" height="100%" fill="white"/>
            <!-- Black cuts a transparent hole for the spotlight with rounded corners -->
            <rect id="govguide-cutout-rect" x="0" y="0" width="0" height="0" rx="10" ry="10" fill="black"/>
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(15, 23, 42, 0.42)" mask="url(#govguide-spotlight-mask)"/>
      `;
      this.shadowRoot.appendChild(svg);
      this.svgElement = svg;

      // Pulse ring for highlighting boundaries
      const ring = document.createElement('div');
      ring.className = 'govguide-target-ring';
      ring.style.display = 'none';
      this.shadowRoot.appendChild(ring);
      this.pulseRing = ring;
    }

    _bindResize() {
      window.addEventListener('resize', () => {
        if (this.currentTarget) {
          this.highlight(this.currentTarget, false);
        }
      });
      window.addEventListener('scroll', () => {
        if (this.currentTarget) {
          this.highlight(this.currentTarget, false);
        }
      }, { passive: true });
    }

    highlight(element, autoScroll = true) {
      this.currentTarget = element;
      if (!element) {
        this.clear();
        return;
      }

      if (autoScroll && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }

      const rect = element.getBoundingClientRect();
      const padding = 6;
      const x = Math.max(0, rect.left - padding);
      const y = Math.max(0, rect.top - padding);
      const width = Math.max(10, rect.width + padding * 2);
      const height = Math.max(10, rect.height + padding * 2);

      // Update SVG cutout
      const cutout = this.svgElement.querySelector('#govguide-cutout-rect');
      if (cutout) {
        cutout.setAttribute('x', x);
        cutout.setAttribute('y', y);
        cutout.setAttribute('width', width);
        cutout.setAttribute('height', height);
      }
      this.svgElement.style.opacity = '1';

      // Update pulse ring
      this.pulseRing.style.display = 'block';
      this.pulseRing.style.left = `${Math.round(x)}px`;
      this.pulseRing.style.top = `${Math.round(y)}px`;
      this.pulseRing.style.width = `${Math.round(width)}px`;
      this.pulseRing.style.height = `${Math.round(height)}px`;
    }

    getTargetRect() {
      if (!this.currentTarget) return null;
      return this.currentTarget.getBoundingClientRect();
    }

    clear() {
      this.currentTarget = null;
      if (this.svgElement) {
        const cutout = this.svgElement.querySelector('#govguide-cutout-rect');
        if (cutout) {
          cutout.setAttribute('width', '0');
          cutout.setAttribute('height', '0');
        }
        this.svgElement.style.opacity = '0';
      }
      if (this.pulseRing) {
        this.pulseRing.style.display = 'none';
      }
    }
  }

  window.GovGuideHighlighter = Highlighter;
})();
