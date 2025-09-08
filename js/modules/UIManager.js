/**
 * UIManager - Handles all UI interactions and state management
 * Modern approach to UI handling with proper event delegation
 */

export class UIManager {
  constructor() {
    this.eventListeners = new Map();
    this.initialized = false;
  }

  async init() {
    try {
      this.setupEventDelegation();
      this.initializeControls();
      this.setupKeyboardShortcuts();
      this.setupResponsiveHandling();
      this.initialized = true;
      console.log('UIManager initialized');
    } catch (error) {
      console.error('Failed to initialize UIManager:', error);
      throw error;
    }
  }

  setupEventDelegation() {
    // Use event delegation for better performance and dynamic content handling
    document.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('change', this.handleChange.bind(this));
    document.addEventListener('input', this.handleInput.bind(this));
  }

  handleClick(event) {
    const { target } = event;
    
    // Handle subdivision buttons
    if (target.closest('.subdivision')) {
      this.handleSubdivisionClick(target, event);
      return;
    }

    // Handle metronome buttons
    if (target.closest('.metronomeButton')) {
      this.handleMetronomeClick(target, event);
      return;
    }

    // Handle play buttons
    if (target.closest('.midiPlayImage')) {
      this.handlePlayClick(target, event);
      return;
    }

    // Handle play+ buttons
    if (target.closest('.midiPlayPlusImage')) {
      this.handlePlayPlusClick(target, event);
      return;
    }

    // Handle note clicks
    if (target.closest('.hi-hat, .snare, .kick, .tom1, .tom2, .tom4')) {
      this.handleNoteClick(target, event);
      return;
    }

    // Handle menu clicks
    if (target.closest('.rightButtons')) {
      this.handleMenuClick(target, event);
      return;
    }
  }

  handleChange(event) {
    const { target } = event;
    
    // Handle tempo slider
    if (target.id === 'tempoSlider') {
      this.handleTempoChange(target.value);
      return;
    }

    // Handle swing slider
    if (target.id === 'swingSlider') {
      this.handleSwingChange(target.value);
      return;
    }

    // Handle time signature changes
    if (target.id.includes('timeSig')) {
      this.handleTimeSigChange();
      return;
    }
  }

  handleInput(event) {
    const { target } = event;
    
    // Handle text field inputs with debouncing
    if (target.matches('#tuneTitle, #tuneAuthor, #tuneComments')) {
      this.debounceTextInput(target);
    }
  }

  handleSubdivisionClick(target, event) {
    event.preventDefault();
    const subdivision = this.extractSubdivisionFromElement(target);
    if (subdivision && window.myGrooveWriter) {
      window.myGrooveWriter.changeDivision(subdivision);
    }
  }

  handleMetronomeClick(target, event) {
    event.preventDefault();
    const frequency = this.extractMetronomeFrequency(target);
    if (frequency !== null && window.myGrooveWriter) {
      window.myGrooveWriter.setMetronomeFrequency(frequency);
    }
  }

  handlePlayClick(target, event) {
    event.preventDefault();
    if (window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils) {
      window.myGrooveWriter.myGrooveUtils.lastClickedButton = 'normal';
      window.myGrooveWriter.myGrooveUtils.startOrStopMIDI_playback();
    }
  }

  handlePlayPlusClick(target, event) {
    event.preventDefault();
    if (window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils) {
      window.myGrooveWriter.myGrooveUtils.startAutoSpeedUpPlayback();
    }
  }

  handleNoteClick(target, event) {
    event.preventDefault();
    // Delegate to existing note handling logic
    if (window.myGrooveWriter) {
      const noteType = this.getNoteTypeFromElement(target);
      const noteIndex = this.getNoteIndexFromElement(target);
      if (noteType && noteIndex !== null) {
        window.myGrooveWriter.handleNoteClick(noteType, noteIndex);
      }
    }
  }

  handleMenuClick(target, event) {
    event.preventDefault();
    const menuType = this.getMenuTypeFromElement(target);
    if (menuType && window.myGrooveWriter) {
      switch (menuType) {
        case 'grooves':
          window.myGrooveWriter.groovesAnchorClick(event);
          break;
        case 'myGrooves':
          window.myGrooveWriter.myGrooveAnchorClick(event);
          break;
        case 'help':
          window.myGrooveWriter.helpAnchorClick(event);
          break;
        case 'permutation':
          window.myGrooveWriter.permutationAnchorClick(event);
          break;
      }
    }
  }

  handleTempoChange(value) {
    if (window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils) {
      window.myGrooveWriter.myGrooveUtils.setTempo(parseInt(value, 10));
      window.myGrooveWriter.myGrooveUtils.midiNoteHasChanged();
    }
  }

  handleSwingChange(value) {
    if (window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils) {
      window.myGrooveWriter.myGrooveUtils.setSwing(parseInt(value, 10));
      window.myGrooveWriter.myGrooveUtils.midiNoteHasChanged();
    }
  }

  handleTimeSigChange() {
    if (window.myGrooveWriter) {
      window.myGrooveWriter.refresh_ABC();
    }
  }

  setupKeyboardShortcuts() {
    const shortcuts = new Map([
      ['Space', () => this.togglePlayback()],
      ['KeyZ', (event) => event.ctrlKey && this.undo()],
      ['KeyY', (event) => event.ctrlKey && this.redo()],
      ['KeyS', (event) => event.ctrlKey && this.save(event)],
      ['Escape', () => this.closeModals()]
    ]);

    document.addEventListener('keydown', (event) => {
      const handler = shortcuts.get(event.code);
      if (handler) {
        // Prevent default only if not in input field
        if (!this.isInputElement(event.target)) {
          event.preventDefault();
          handler(event);
        }
      }
    });
  }

  setupResponsiveHandling() {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    this.handleResponsiveChange(mediaQuery);
    mediaQuery.addListener(this.handleResponsiveChange.bind(this));
  }

  handleResponsiveChange(mediaQuery) {
    const body = document.body;
    if (mediaQuery.matches) {
      body.classList.add('mobile-layout');
    } else {
      body.classList.remove('mobile-layout');
    }
  }

  initializeControls() {
    // Initialize sliders with modern range input handling
    this.initializeSlider('tempoSlider', 60, 200, 120);
    this.initializeSlider('swingSlider', 0, 100, 0);
    
    // Initialize checkboxes
    this.initializeCheckboxes();
    
    // Initialize dropdowns
    this.initializeDropdowns();
  }

  initializeSlider(id, min, max, defaultValue) {
    const slider = document.getElementById(id);
    if (slider) {
      slider.min = min;
      slider.max = max;
      slider.value = defaultValue;
      
      // Add visual feedback
      this.updateSliderBackground(slider);
      slider.addEventListener('input', () => this.updateSliderBackground(slider));
    }
  }

  updateSliderBackground(slider) {
    const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, #2484C0 0%, #2484C0 ${percentage}%, #ddd ${percentage}%, #ddd 100%)`;
  }

  initializeCheckboxes() {
    // Add custom styling and behavior to checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', this.handleCheckboxChange.bind(this));
    });
  }

  initializeDropdowns() {
    // Initialize custom dropdown behavior
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
      select.addEventListener('change', this.handleSelectChange.bind(this));
    });
  }

  // Utility methods
  extractSubdivisionFromElement(element) {
    const id = element.closest('[id]')?.id;
    if (id) {
      const match = id.match(/subdivision_(\d+)ths?/);
      return match ? parseInt(match[1], 10) : null;
    }
    return null;
  }

  extractMetronomeFrequency(element) {
    const id = element.id;
    if (id === 'metronomeOff') return 0;
    if (id === 'metronome4ths') return 4;
    if (id === 'metronome8ths') return 8;
    if (id === 'metronome16ths') return 16;
    return null;
  }

  getNoteTypeFromElement(element) {
    const classList = element.classList;
    if (classList.contains('hi-hat')) return 'hh';
    if (classList.contains('snare')) return 'snare';
    if (classList.contains('kick')) return 'kick';
    if (classList.contains('tom1')) return 'tom1';
    if (classList.contains('tom2')) return 'tom2';
    if (classList.contains('tom4')) return 'tom4';
    return null;
  }

  getNoteIndexFromElement(element) {
    const id = element.id;
    const match = id.match(/\d+$/);
    return match ? parseInt(match[0], 10) : null;
  }

  getMenuTypeFromElement(element) {
    const id = element.id;
    if (id.includes('grooves')) return 'grooves';
    if (id.includes('myGroove')) return 'myGrooves';
    if (id.includes('help')) return 'help';
    if (id.includes('permutation')) return 'permutation';
    return null;
  }

  isInputElement(element) {
    const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT'];
    return inputTypes.includes(element.tagName);
  }

  // Action methods
  togglePlayback() {
    if (window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils) {
      window.myGrooveWriter.myGrooveUtils.startOrStopMIDI_playback();
    }
  }

  undo() {
    if (window.myGrooveWriter) {
      window.myGrooveWriter.undoCommand();
    }
  }

  redo() {
    if (window.myGrooveWriter) {
      window.myGrooveWriter.redoCommand();
    }
  }

  save(event) {
    event.preventDefault();
    if (window.myGrooveWriter) {
      window.myGrooveWriter.saveCurrentGroove();
    }
  }

  closeModals() {
    // Close any open modals
    const modals = document.querySelectorAll('.modal, .popup');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
  }

  // Debounced text input handler
  debounceTextInput(target) {
    const debounced = this.debounce(function () {
      if (window.myGrooveWriter) {
        window.myGrooveWriter.refresh_ABC();
      }
    }, 500);
    debounced(target);
  }

  // Utility debounce function
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
