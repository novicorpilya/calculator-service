(function() {
  const SCRIPT_ID = 'hics-calculator-script';
  
  // Find the script tag that loaded this script to determine the base URL
  const scriptTag = document.currentScript || document.getElementById(SCRIPT_ID);
  const baseUrl = scriptTag ? new URL(scriptTag.src).origin : window.location.origin;

  const init = (options) => {
    const container = document.querySelector(options.container || '#hics-calculator-widget');
    if (!container) {
      console.warn('HICS Calculator: Container not found', options.container);
      return;
    }

    const partnerId = options.partnerId || '';
    const iframeUrl = `${baseUrl}/embed/calculator?partner=${partnerId}`;

    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.overflow = 'hidden';
    wrapper.style.transition = 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    wrapper.style.height = options.initialHeight || '850px';
    wrapper.style.borderRadius = '32px';
    wrapper.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';

    const iframe = document.createElement('iframe');
    iframe.src = iframeUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.id = 'hics-calc-iframe';
    iframe.setAttribute('scrolling', 'no');

    wrapper.appendChild(iframe);
    container.appendChild(wrapper);

    // Listen for resize messages from the iframe
    window.addEventListener('message', (event) => {
      // Security: Validate origin if needed
      // if (event.origin !== baseUrl) return;

      if (event.data.type === 'HICS_RESIZE') {
        wrapper.style.height = event.data.height + 'px';
      }
    });

    // Handle full screen or other events if necessary
  };

  // Expose global API
  window.HicsCalc = {
    init: init,
    version: '2.0.0-production'
  };

  // Support for async initialization
  if (window.HicsCalcQueue && window.HicsCalcQueue.length > 0) {
    window.HicsCalcQueue.forEach(args => init(...args));
    window.HicsCalcQueue = [];
  }
})();
