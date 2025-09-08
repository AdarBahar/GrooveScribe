/**
/* eslint-disable prettier/prettier, no-console */

 * Main entry point for GrooveScribe application
 * Modern ES6+ module-based initialization
 */

import { AudioManager } from './modules/AudioManager.js';

// Note: CSS imports are not supported in browsers without a bundler
// CSS files are loaded via <link> tags in index.html

// For now, we'll enhance the existing legacy code rather than replace it
// The modern modules will be implemented gradually

class GrooveScribeApp {
  constructor() {
    this.initialized = false;
    this.audioManager = null;
  }

  async init() {
    try {
      console.log('Modern GrooveScribe enhancements loading...');

      // Initialize modern audio system first
      await this.initializeModernAudio();

      // Check if legacy code is available
      if (window.myGrooveWriter) {
        console.log('Legacy GrooveWriter found, adding modern enhancements');
        this.enhanceLegacyCode();
      } else {
        console.log('Legacy GrooveWriter not found, waiting...');
        // Wait for legacy initialization
        setTimeout(() => this.init(), 100);
        return;
      }

      this.initialized = true;
      console.log('Modern GrooveScribe enhancements loaded successfully');

    } catch (error) {
      console.error('Failed to load modern enhancements:', error);
      // Don't show error to user since legacy code should still work
    }
  }

  async initializeModernAudio() {
    try {
      console.log('Initializing modern audio system...');
      this.audioManager = new AudioManager();
      await this.audioManager.initialize();

      // Create MIDI.js bridge for backward compatibility
      this.createMidiJsBridge();

      // Replace the broken play_single_note_for_note_setting function
      this.replaceBrokenAudioFunctions();

      console.log('Modern audio system initialized successfully');

    } catch (error) {
      console.error('Failed to initialize modern audio system:', error);
      // Continue without modern audio - legacy MIDI.js may still work
    }
  }

  createMidiJsBridge() {
    // Create a modern replacement for MIDI.js that uses our AudioManager
    if (!window.MIDI) {
      window.MIDI = {};
    }

    // Replace MIDI.WebAudio with our modern system
    window.MIDI.WebAudio = {
      noteOn: (channel, note, velocity, delay) => {
        if (this.audioManager) {
          return this.audioManager.playMidiNote(channel, note, velocity, delay);
        }
        return false;
      },
      noteOff: () => {
        // Note off is not needed for drum samples (they're one-shots)
        return true;
      },
      stopAllNotes: () => {
        // Not implemented for drum samples
        return true;
      }
    };

    // Also replace MIDI.AudioTag for full compatibility
    window.MIDI.AudioTag = {
      noteOn: (channel, note, velocity, delay) => {
        if (this.audioManager) {
          return this.audioManager.playMidiNote(channel, note, velocity, delay);
        }
        return false;
      },
      noteOff: () => {
        return true;
      }
    };

    console.log('MIDI.js bridge created successfully');
  }

  replaceBrokenAudioFunctions() {
    // Replace the global play_single_note_for_note_setting function
    window.play_single_note_for_note_setting = (note_val) => {
      if (this.audioManager) {
        return this.audioManager.playMidiNote(9, note_val, 127, 0);
      } else {
        console.warn('AudioManager not available, falling back to legacy MIDI.js');
        // Fallback to original implementation
        if (window.MIDI && window.MIDI.WebAudio) {
          return window.MIDI.WebAudio.noteOn(9, note_val, 127, 0);
        } else if (window.MIDI && window.MIDI.AudioTag) {
          return window.MIDI.AudioTag.noteOn(9, note_val, 127, 0);
        }
        return false;
      }
    };

    console.log('Audio functions replaced with modern implementation');
  }

  enhanceLegacyCode() {
    // Add modern enhancements to the existing legacy code
    this.addModernEventListeners();
    this.addModernUIEnhancements();
    this.addModernAccessibilityFeatures();
    this.addAudioEnhancements();
  }

  addAudioEnhancements() {
    // Add modern audio enhancements
    if (this.audioManager) {
      // Expose audio manager globally for debugging
      window.modernAudioManager = this.audioManager;

      // Add audio test function
      window.testDrumSound = (midiNote) => {
        if (this.audioManager) {
          const result = this.audioManager.playMidiNote(9, midiNote, 127, 0);
          console.log(`Testing MIDI note ${midiNote}: ${result ? 'SUCCESS' : 'FAILED'}`);
          return result;
        }
        return false;
      };

      // Add function to get available samples
      window.getAvailableAudioSamples = () => {
        if (this.audioManager) {
          return this.audioManager.getAvailableSamples();
        }
        return [];
      };

      // Add MIDI mapping debugging
      window.getMidiMapping = () => {
        if (this.audioManager) {
          return this.audioManager.getMidiMapping();
        }
        return {};
      };
    }
  }

  addModernEventListeners() {
    // Add modern event handling enhancements

    // Handle visibility changes for better audio management
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils) {
        // Pause playback when page is hidden
        if (window.myGrooveWriter.myGrooveUtils.isMIDIPlaying && window.myGrooveWriter.myGrooveUtils.isMIDIPlaying()) {
          window.myGrooveWriter.myGrooveUtils.pauseMIDI_playback();
        }
      }
    });

    // Handle window resize for responsive layout
    window.addEventListener('resize', this.debounce(() => {
      if (window.myGrooveWriter && typeof window.myGrooveWriter.refresh_ABC === 'function') {
        window.myGrooveWriter.refresh_ABC();
      }
    }, 250));

    // Add keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardShortcuts(event);
    });
  }

  addModernUIEnhancements() {
    // Add modern UI enhancements
    this.addTouchGestures();
    this.addLoadingIndicators();
    this.addNotificationSystem();
  }

  addModernAccessibilityFeatures() {
    // Add accessibility enhancements
    this.addAriaLabels();
    this.addKeyboardNavigation();
    this.addScreenReaderSupport();
  }

  handleKeyboardShortcuts(event) {
    // Don't interfere with input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    // Handle keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'z':
          event.preventDefault();
          if (window.myGrooveWriter && typeof window.myGrooveWriter.undoCommand === 'function') {
            window.myGrooveWriter.undoCommand();
          }
          break;
        case 'y':
          event.preventDefault();
          if (window.myGrooveWriter && typeof window.myGrooveWriter.redoCommand === 'function') {
            window.myGrooveWriter.redoCommand();
          }
          break;
      }
    } else if (event.key === ' ') {
      // Spacebar to play/pause
      event.preventDefault();
      if (window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils) {
        window.myGrooveWriter.myGrooveUtils.startOrStopMIDI_playback();
      }
    }
  }

  addTouchGestures() {
    // Add touch gesture support for mobile devices
    if ('ontouchstart' in window) {
      document.body.classList.add('touch-device');

      // Add swipe gestures for navigation
      let touchStartX = 0;
      let touchStartY = 0;

      document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      });

      document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Detect horizontal swipes
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          if (deltaX > 0) {
            // Swipe right - could trigger some action
            console.log('Swipe right detected');
          } else {
            // Swipe left - could trigger some action
            console.log('Swipe left detected');
          }
        }
      });
    }
  }

  addLoadingIndicators() {
    // Add loading indicators for better UX
    const style = document.createElement('style');
    style.textContent = `
      .loading-spinner {
        border: 2px solid #f3f3f3;
        border-top: 2px solid #2484C0;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        animation: spin 1s linear infinite;
        display: inline-block;
        margin-right: 8px;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  addNotificationSystem() {
    // Add a modern notification system
    window.showNotification = (message, type = 'info', duration = 3000) => {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;

      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 16px',
        borderRadius: '6px',
        color: 'white',
        fontFamily: 'Lato, sans-serif',
        fontSize: '14px',
        zIndex: '10000',
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        backgroundColor: type === 'error' ? '#ff4444' : type === 'success' ? '#22aa22' : '#2484C0'
      });

      document.body.appendChild(notification);

      // Animate in
      setTimeout(() => notification.style.transform = 'translateX(0)', 10);

      // Auto-remove
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, duration);
    };
  }

  addAriaLabels() {
    // Add ARIA labels for better accessibility
    setTimeout(() => {
      const playButton = document.querySelector('.midiPlayImage');
      if (playButton) {
        playButton.setAttribute('aria-label', 'Play or pause groove');
        playButton.setAttribute('role', 'button');
      }

      const subdivisionButtons = document.querySelectorAll('.subdivision');
      subdivisionButtons.forEach(button => {
        const text = button.textContent.trim();
        button.setAttribute('aria-label', `Select ${text} subdivision`);
        button.setAttribute('role', 'button');
      });

      const metronomeButtons = document.querySelectorAll('.metronomeButton');
      metronomeButtons.forEach(button => {
        const text = button.textContent.trim();
        button.setAttribute('aria-label', `Set metronome to ${text}`);
        button.setAttribute('role', 'button');
      });
    }, 1000); // Wait for DOM to be populated
  }

  addKeyboardNavigation() {
    // Add keyboard navigation support
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        // Ensure tab navigation works properly
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });

    // Add focus styles for keyboard navigation
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-navigation *:focus {
        outline: 2px solid #2484C0 !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }

  addScreenReaderSupport() {
    // Add screen reader announcements for important actions
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(announcer);

    window.announceToScreenReader = (message) => {
      announcer.textContent = message;
      setTimeout(() => announcer.textContent = '', 1000);
    };
  }

  // Utility function for debouncing
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
}

// Initialize the application
const app = new GrooveScribeApp();

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Export for potential external use (when using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
} else if (typeof window !== 'undefined') {
  window.GrooveScribeApp = app;
}
