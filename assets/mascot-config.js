/**
 * GovGuide - Mascot Configuration
 * 
 * To replace or customize the mascot:
 * 1. Put your new SVG, PNG, or GIF in assets/
 * 2. Update the assetPath and dimensions below.
 * No changes to the core engine are required.
 */
(function() {
  const MascotConfig = {
    // Relative to extension root or web page
    type: 'svg', // 'svg' | 'image' | 'lottie' (future)
    assetPath: 'assets/mascot-default.svg',
    defaultWidth: 90,
    defaultHeight: 90,
    name: 'Sathi',
    pointingHandOffset: {
      x: 45, // offset from center to pointing wingtip
      y: -10
    }
  };

  if (typeof window !== 'undefined') {
    window.GovGuideMascotConfig = MascotConfig;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MascotConfig;
  }
})();
