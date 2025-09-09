/**
 * GrooveWriter - Modern groove writing and editing functionality
 * Refactored from legacy groove_writer.js with improved architecture
 */

import { GrooveUtils } from './GrooveUtils.js';

export class GrooveWriter {
  constructor() {
    this.myGrooveUtils = new GrooveUtils();
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndoStackSize = 40;

    // Groove state
    this.numberOfMeasures = 1;
    this.timeDivision = parseInt(this.myGrooveUtils.getQueryVariableFromURL('Div', '16'), 10);
    this.numBeatsPerMeasure = 4;
    this.noteValuePerMeasure = 4;
    this.notesPerMeasure = this.calculateNotesPerMeasure();

    // Metronome state
    this.metronomeAutoSpeedUpActive = false;
    this.metronomeCountInActive = false;
    this.metronomeCountInIsPlaying = false;
    this.metronomeFrequency = 0;
    this.metronomeOffsetClickStart = '1';
    this.metronomeSolo = false;

    // UI state
    this.advancedEditMode = false;
    this.permutationType = 'none';
    this.editingGrooveId = null;

    // Auto speed up state
    this.midiStartTime = null;
    this.midiStartTempo = 0;
    this.lastMidiTempoIncreaseTime = null;
    this.lastMidiTempoIncreaseRemainder = 0;

    this.initialize();
  }

  initialize() {
    // Set debug mode immediately for use in index.html
    this.myGrooveUtils.debugMode =
      parseInt(this.myGrooveUtils.getQueryVariableFromURL('Debug', '0'), 10) === 1;

    // Initialize from URL parameters
    this.loadFromURL();

    // Set up event callbacks
    this.setupEventCallbacks();
  }

  calculateNotesPerMeasure() {
    return this.myGrooveUtils.calc_notes_per_measure(
      this.timeDivision,
      this.numBeatsPerMeasure,
      this.noteValuePerMeasure
    );
  }

  loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);

    // Load time signature
    const timeSig = urlParams.get('TimeSig');
    if (timeSig) {
      const [top, bottom] = timeSig.split('/').map(n => parseInt(n, 10));
      if (top && bottom) {
        this.numBeatsPerMeasure = top;
        this.noteValuePerMeasure = bottom;
        this.notesPerMeasure = this.calculateNotesPerMeasure();
      }
    }

    // Load other parameters
    this.numberOfMeasures = parseInt(urlParams.get('Measures') || '1', 10);

    // Load tempo and swing
    const tempo = parseInt(urlParams.get('Tempo') || '120', 10);
    const swing = parseInt(urlParams.get('Swing') || '0', 10);

    this.myGrooveUtils.setTempo(tempo);
    this.myGrooveUtils.setSwing(swing);
  }

  setupEventCallbacks() {
    // Set up MIDI event callbacks
    this.myGrooveUtils.midiEventCallbacks = {
      loadMidiDataEvent: (_root, playStarting) => {
        this.handleMidiDataLoad(playStarting);
      },
      notePlaying: (_root, noteType, percentComplete) => {
        this.handleNotePlaying(noteType, percentComplete);
      },
      playEvent: (_root) => {
        this.handlePlayEvent();
      },
      stopEvent: (_root) => {
        this.handleStopEvent();
      },
      pauseEvent: (_root) => {
        this.handlePauseEvent();
      },
      midiInitialized: (_root) => {
        this.handleMidiInitialized();
      }
    };
  }

  // Event handlers
  handleMidiDataLoad(playStarting) {
    let midiURL;

    if (playStarting && this.metronomeCountInActive) {
      midiURL = this.myGrooveUtils.buildMidiUrlCountInTrack(
        this.numBeatsPerMeasure,
        this.noteValuePerMeasure
      );
      this.myGrooveUtils.midiNoteHasChanged();
      this.metronomeCountInIsPlaying = true;
    } else {
      if (this.metronomeCountInIsPlaying) {
        this.metronomeCountInIsPlaying = false;
        this.myGrooveUtils.resetMetronomeOptionsOffsetClickStartRotation();
      }
      midiURL = this.createMidiUrlFromClickableUI('our_MIDI');
      this.myGrooveUtils.midiResetNoteHasChanged();
    }

    this.myGrooveUtils.loadMIDIFromURL(midiURL);
    this.updateGrooveDBSource();
  }

  handleNotePlaying(noteType, percentComplete) {
    if (noteType === 'complete' && this.metronomeAutoSpeedUpActive) {
      this.myGrooveUtils.midiNoteHasChanged();
      this.metronomeAutoSpeedUpTempoUpdate();
    }

    this.highlightNote(noteType, percentComplete);
  }

  handlePlayEvent() {
    // Update play button states
    this.updatePlayButtonStates('playing');
  }

  handleStopEvent() {
    // Update play button states
    this.updatePlayButtonStates('stopped');
  }

  handlePauseEvent() {
    // Update play button states
    this.updatePlayButtonStates('paused');
  }

  handleMidiInitialized() {
    // Enable play buttons
    this.enablePlayButtons();
  }

  // UI update methods
  updatePlayButtonStates(state) {
    const playButton = document.getElementById(
      `midiPlayImage${this.myGrooveUtils.grooveUtilsUniqueIndex}`
    );
    const playPlusButton = document.getElementById(
      `midiPlayPlusImage${this.myGrooveUtils.grooveUtilsUniqueIndex}`
    );

    if (playButton) {
      playButton.className = `midiPlayImage ${state.charAt(0).toUpperCase() + state.slice(1)}`;
    }

    if (playPlusButton) {
      playPlusButton.className = `midiPlayPlusImage ${state.charAt(0).toUpperCase() + state.slice(1)}`;
    }
  }

  enablePlayButtons() {
    const playButton = document.getElementById(
      `midiPlayImage${this.myGrooveUtils.grooveUtilsUniqueIndex}`
    );
    const playPlusButton = document.getElementById(
      `midiPlayPlusImage${this.myGrooveUtils.grooveUtilsUniqueIndex}`
    );

    if (playButton) {
      playButton.onclick = (_event) => {
        this.myGrooveUtils.lastClickedButton = 'normal';
        this.myGrooveUtils.startOrStopMIDI_playback();
      };
    }

    if (playPlusButton) {
      playPlusButton.onclick = (_event) => {
        this.myGrooveUtils.startAutoSpeedUpPlayback();
      };
    }
  }

  // Auto Speed Up functionality
  enableAutoSpeedUp() {
    this.metronomeAutoSpeedUpActive = true;
    this.addOrRemoveKeywordFromClassById('metronomeOptionsContextMenuSpeedUp', 'menuChecked', true);
    this.metronomeOptionsMenuSetSelectedState();
    if (window.__GS_DEBUG__) console.log('Auto Speed Up enabled via Play+ button');
  }

  disableAutoSpeedUp() {
    this.metronomeAutoSpeedUpActive = false;
    this.addOrRemoveKeywordFromClassById(
      'metronomeOptionsContextMenuSpeedUp',
      'menuChecked',
      false
    );
    this.metronomeOptionsMenuSetSelectedState();
    if (window.__GS_DEBUG__) console.log('Auto Speed Up disabled via regular Play button');
  }

  metronomeAutoSpeedUpTempoUpdate() {
    let totalTempoIncreaseAmount = 1;
    const amountElement = document.getElementById('metronomeAutoSpeedupTempoIncreaseAmount');
    if (amountElement) {
      totalTempoIncreaseAmount = parseInt(amountElement.value, 10);
    }

    let tempoIncreaseInterval = 60;
    const intervalElement = document.getElementById('metronomeAutoSpeedupTempoIncreaseInterval');
    if (intervalElement) {
      tempoIncreaseInterval = parseInt(intervalElement.value, 10) * 60; // convert to seconds
    }

    let keepIncreasingForever = false;
    const keepIncreasingElement = document.getElementById('metronomeAutoSpeedUpKeepGoingForever');
    if (keepIncreasingElement) {
      keepIncreasingForever = keepIncreasingElement.checked;
    }

    const currentTempo = this.myGrooveUtils.getTempo();
    const midiStartTime = this.myGrooveUtils.getMidiStartTime();

    if (this.midiStartTime !== midiStartTime) {
      this.midiStartTime = midiStartTime;
      this.midiStartTempo = currentTempo;
      this.lastMidiTempoIncreaseTime = null;
      this.lastMidiTempoIncreaseRemainder = 0;
    }

    const currentTime = new Date().getTime() / 1000;
    const elapsedTime = currentTime - this.midiStartTime;

    if (elapsedTime > tempoIncreaseInterval) {
      const numberOfIncreases = Math.floor(elapsedTime / tempoIncreaseInterval);

      if (
        !this.lastMidiTempoIncreaseTime ||
        this.lastMidiTempoIncreaseTime + tempoIncreaseInterval <= currentTime
      ) {
        if (keepIncreasingForever || numberOfIncreases === 1) {
          const newTempo = currentTempo + totalTempoIncreaseAmount;
          this.myGrooveUtils.setTempo(newTempo);
          this.lastMidiTempoIncreaseTime = currentTime;

          if (window.__GS_DEBUG__) console.log(`Auto Speed Up: ${currentTempo} -> ${newTempo} BPM`);
        }
      }
    }
  }

  // Auto Speed Up configuration
  showMetronomeAutoSpeedupConfiguration() {
    const popup = document.getElementById('metronomeAutoSpeedupConfiguration');
    if (popup) {
      popup.style.display = 'block';
    }

    // Load defaults if they exist
    const defaults = this.loadAutoSpeedUpDefaults();
    if (defaults) {
      const amountElement = document.getElementById('metronomeAutoSpeedupTempoIncreaseAmount');
      const intervalElement = document.getElementById('metronomeAutoSpeedupTempoIncreaseInterval');
      const keepGoingElement = document.getElementById('metronomeAutoSpeedUpKeepGoingForever');

      if (amountElement) amountElement.value = defaults.bpmAmount;
      if (intervalElement) intervalElement.value = defaults.intervalMinutes;
      if (keepGoingElement) keepGoingElement.checked = defaults.keepIncreasing;
    }

    this.updateAutoSpeedUpOutputLabels();
  }

  closeMetronomeAutoSpeedupConfiguration(_type) {
    const popup = document.getElementById('metronomeAutoSpeedupConfiguration');

    // Save as default if checkbox is checked
    const setAsDefaultCheckbox = document.getElementById('metronomeAutoSpeedUpSetAsDefault');
    if (setAsDefaultCheckbox && setAsDefaultCheckbox.checked) {
      this.saveAutoSpeedUpDefaults();
    }

    if (popup) {
      popup.style.display = 'none';
    }
  }

  saveAutoSpeedUpDefaults() {
    const amountElement = document.getElementById('metronomeAutoSpeedupTempoIncreaseAmount');
    const intervalElement = document.getElementById('metronomeAutoSpeedupTempoIncreaseInterval');
    const keepGoingElement = document.getElementById('metronomeAutoSpeedUpKeepGoingForever');

    const defaults = {
      bpmAmount: amountElement ? parseInt(amountElement.value, 10) : 5,
      intervalMinutes: intervalElement ? parseInt(intervalElement.value, 10) : 2,
      keepIncreasing: keepGoingElement ? keepGoingElement.checked : false
    };

    this.myGrooveUtils.saveToLocalStorage('autoSpeedUpDefaults', defaults);
    if (window.__GS_DEBUG__) console.log('Auto Speed Up defaults saved:', defaults);
  }

  loadAutoSpeedUpDefaults() {
    return this.myGrooveUtils.loadFromLocalStorage('autoSpeedUpDefaults', null);
  }

  updateAutoSpeedUpOutputLabels() {
    const amountElement = document.getElementById('metronomeAutoSpeedupTempoIncreaseAmount');
    const intervalElement = document.getElementById('metronomeAutoSpeedupTempoIncreaseInterval');
    const amountOutput = document.getElementById('metronomeAutoSpeedupTempoIncreaseAmountOutput');
    const intervalOutput = document.getElementById(
      'metronomeAutoSpeedupTempoIncreaseIntervalOutput'
    );

    if (amountElement && amountOutput) {
      amountOutput.textContent = amountElement.value;
    }

    if (intervalElement && intervalOutput) {
      intervalOutput.textContent = intervalElement.value;
    }
  }

  // Utility methods
  addOrRemoveKeywordFromClassById(elementId, keyword, add) {
    const element = document.getElementById(elementId);
    if (element) {
      if (add) {
        element.classList.add(keyword);
      } else {
        element.classList.remove(keyword);
      }
    }
  }

  metronomeOptionsMenuSetSelectedState() {
    const optionsAnchor = document.getElementById('metronomeOptionsAnchor');
    if (optionsAnchor) {
      if (
        this.myGrooveUtils.getMetronomeSolo() ||
        this.metronomeAutoSpeedUpActive ||
        this.myGrooveUtils.getMetronomeOffsetClickStart() !== '1'
      ) {
        optionsAnchor.classList.add('selected');
      } else {
        optionsAnchor.classList.remove('selected');
      }
    }
  }
}
