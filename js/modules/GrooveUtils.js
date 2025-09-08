/**
 * GrooveUtils - Modernized utility functions for GrooveScribe
 * Refactored from legacy groove_utils.js to use ES6+ features
 */

export class GrooveUtils {
  constructor() {
    this.abc_obj = null;
    this.note_mapping_array = null;
    this.debugMode = false;
    this.viewMode = true;
    this.grooveDBAuthoring = false;
    this.isMIDIPaused = false;
    this.shouldMIDIRepeat = true;
    this.swingIsEnabled = false;
    this.grooveUtilsUniqueIndex = Date.now();
    this.midiEventCallbacks = null;
    this.lastClickedButton = null;

    // Initialize from URL parameters
    this.initializeFromURL();
  }

  initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    this.debugMode = parseInt(urlParams.get('Debug') || '0', 10) === 1;
    this.viewMode = urlParams.get('ViewMode') !== 'false';
    this.grooveDBAuthoring = urlParams.get('GrooveDBAuthoring') === 'true';
  }

  // Modern URL parameter handling
  getQueryVariableFromURL(variable, defaultValue = '') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(variable) || defaultValue;
  }

  // Improved tempo management
  getTempo() {
    const tempoElement = document.getElementById('tempoSlider');
    if (tempoElement) {
      return parseInt(tempoElement.value, 10);
    }
    return 120; // Default tempo
  }

  setTempo(tempo) {
    const tempoElement = document.getElementById('tempoSlider');
    if (tempoElement) {
      tempoElement.value = tempo;
      this.updateTempoDisplay(tempo);
    }
  }

  updateTempoDisplay(tempo) {
    const display = document.getElementById('tempoDisplay');
    if (display) {
      display.textContent = `${tempo} BPM`;
    }
  }

  // Swing percentage management
  getSwing() {
    const swingElement = document.getElementById('swingSlider');
    if (swingElement) {
      return parseInt(swingElement.value, 10);
    }
    return 0; // No swing by default
  }

  setSwing(swingPercent) {
    const swingElement = document.getElementById('swingSlider');
    if (swingElement) {
      swingElement.value = swingPercent;
      this.updateSwingDisplay(swingPercent);
    }
  }

  updateSwingDisplay(swing) {
    const display = document.getElementById('swingDisplay');
    if (display) {
      display.textContent = `${swing}%`;
    }
  }

  // Device detection with modern approach
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // Modern audio context handling
  async initializeAudioContext() {
    try {
      if (!window.AudioContext && !window.webkitAudioContext) {
        throw new Error('Web Audio API not supported');
      }

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();

      // Resume context if suspended (required by modern browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      return audioContext;
    } catch (error) {
      if (window.__GS_DEBUG__) console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }

  // Improved error handling
  handleError(error, context = 'Unknown') {
    if (window.__GS_DEBUG__) console.error(`Error in ${context}:`, error);

    // Show user-friendly error message
    this.showNotification(`An error occurred: ${error.message}`, 'error');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '10px 15px',
      borderRadius: '5px',
      color: 'white',
      fontFamily: 'Lato, sans-serif',
      fontSize: '14px',
      zIndex: '10000',
      maxWidth: '300px',
      backgroundColor: type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'
    });

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // Modern localStorage handling with error checking
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      if (window.__GS_DEBUG__) console.error('Failed to save to localStorage:', error);
      return false;
    }
  }

  loadFromLocalStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      if (window.__GS_DEBUG__) console.error('Failed to load from localStorage:', error);
      return defaultValue;
    }
  }

  // Utility for creating DOM elements
  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else {
        element[key] = value;
      }
    });

    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });

    return element;
  }

  // Modern event handling
  addEventListenerSafe(element, event, handler, options = {}) {
    if (element && typeof handler === 'function') {
      element.addEventListener(event, handler, options);
      return () => element.removeEventListener(event, handler, options);
    }
    return () => {};
  }

  // Debounce utility
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle utility
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}
