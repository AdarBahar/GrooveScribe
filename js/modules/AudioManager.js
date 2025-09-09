/**
 * AudioManager - Modern audio handling for GrooveScribe
 * Handles MIDI playback, audio context, and sound generation
 */

export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTempo = 120;
    this.autoSpeedUpActive = false;
    this.autoSpeedUpSettings = {
      bpmAmount: 5,
      intervalMinutes: 2,
      keepIncreasing: false
    };
    this.playbackStartTime = null;
    this.lastSpeedUpTime = null;
    this.audioBuffers = {};

    // MIDI note to drum sample mapping (GrooveScribe specific)
    this.midiToSample = {
      // Kick
      35: 'kick', // constant_OUR_MIDI_KICK_NORMAL

      // Snare variations
      38: 'snare_normal', // constant_OUR_MIDI_SNARE_NORMAL
      21: 'snare_ghost', // constant_OUR_MIDI_SNARE_GHOST
      22: 'snare_accent', // constant_OUR_MIDI_SNARE_ACCENT
      37: 'snare_xstick', // constant_OUR_MIDI_SNARE_XSTICK
      25: 'snare_flam', // constant_OUR_MIDI_SNARE_FLAM
      23: 'snare_drag', // constant_OUR_MIDI_SNARE_DRAG
      24: 'snare_buzz', // constant_OUR_MIDI_SNARE_BUZZ

      // Hi-hat variations
      42: 'hihat_normal', // constant_OUR_MIDI_HIHAT_NORMAL
      46: 'hihat_open', // constant_OUR_MIDI_HIHAT_OPEN
      44: 'hihat_foot', // constant_OUR_MIDI_HIHAT_FOOT
      108: 'hihat_accent', // new mapping
      26: 'hihat_accent', // legacy alias (was constant_OUR_MIDI_HIHAT_ACCENT)
      51: 'ride', // constant_OUR_MIDI_HIHAT_RIDE
      53: 'ride_bell', // constant_OUR_MIDI_HIHAT_RIDE_BELL
      105: 'cowbell', // new mapping
      56: 'cowbell', // legacy alias (was constant_OUR_MIDI_HIHAT_COW_BELL)
      49: 'crash', // constant_OUR_MIDI_HIHAT_CRASH
      52: 'stacker', // new mapping
      55: 'stacker', // legacy alias (was constant_OUR_MIDI_HIHAT_STACKER)

      // Toms
      48: 'tom1', // constant_OUR_MIDI_TOM1_NORMAL (High Tom)
      47: 'tom2', // constant_OUR_MIDI_TOM2_NORMAL (Mid Tom)
      45: 'tom3', // constant_OUR_MIDI_TOM3_NORMAL (Low Tom)
      43: 'tom4', // constant_OUR_MIDI_TOM4_NORMAL (Floor Tom)

      // Metronome
      76: 'metronome_normal', // constant_OUR_MIDI_HIHAT_METRONOME_NORMAL
      77: 'metronome_accent' // constant_OUR_MIDI_HIHAT_METRONOME_ACCENT
    };

    // Sample file name mapping
    this.sampleFiles = {
      kick: 'Kick.mp3',
      snare_normal: 'Snare Normal.mp3',
      snare_ghost: 'Snare Ghost.mp3',
      snare_accent: 'Snare Accent.mp3',
      snare_xstick: 'Snare Cross Stick.mp3',
      snare_flam: 'Snare Flam.mp3',
      snare_drag: 'Drag.mp3',
      snare_buzz: 'Buzz.mp3',
      hihat_normal: 'Hi Hat Normal.mp3',
      hihat_open: 'Hi Hat Open.mp3',
      hihat_foot: 'Hi Hat Foot.mp3',
      hihat_accent: 'Hi Hat Accent.mp3',
      ride: 'Ride.mp3',
      ride_bell: 'Bell.mp3',
      cowbell: 'Cowbell.mp3',
      crash: 'Crash.mp3',
      stacker: 'Stacker.mp3',
      tom1: '10 Tom.mp3', // High Tom
      tom2: '16 Tom.mp3', // Mid Tom
      tom3: 'Rack Tom.mp3', // Low Tom
      tom4: 'Floor Tom.mp3', // Floor Tom
      metronome_normal: 'metronomeClick.mp3',
      metronome_accent: 'metronome1Count.mp3'
    };
  }

  async initialize() {
    try {
      await this.initializeAudioContext();
      await this.loadAudioSamples();
      this.isInitialized = true;
      if (window.__GS_DEBUG__) console.log('AudioManager initialized successfully');
      return true;
    } catch (error) {
      if (window.__GS_DEBUG__) console.error('Failed to initialize AudioManager:', error);
      throw error;
    }
  }

  async initializeAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        throw new Error('Web Audio API not supported');
      }

      this.audioContext = new AudioContext();

      // Resume context if suspended (required by modern browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (window.__GS_DEBUG__) console.log('Audio context initialized');
    } catch (error) {
      if (window.__GS_DEBUG__) console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }

  async loadAudioSamples() {
    try {
      const basePath = 'soundfont/NewDrumSamples/MP3/';
      const loadPromises = Object.entries(this.sampleFiles).map(async ([sampleName, fileName]) => {
        try {
          const url = basePath + fileName;
          const response = await fetch(url);
          if (!response.ok) {
            if (window.__GS_DEBUG__) console.warn(`Failed to load sample: ${sampleName} (${fileName})`);
            return;
          }
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.audioBuffers[sampleName] = audioBuffer;
          if (window.__GS_DEBUG__) console.log(`Loaded sample: ${sampleName}`);
        } catch (error) {
          if (window.__GS_DEBUG__) console.warn(`Error loading sample ${sampleName}:`, error);
        }
      });

      await Promise.all(loadPromises);
      if (window.__GS_DEBUG__) console.log('Audio samples loaded:', Object.keys(this.audioBuffers));
    } catch (error) {
      if (window.__GS_DEBUG__) console.warn('Some audio samples failed to load:', error);
    }
  }

  // Main API method - plays a drum sound by MIDI note number (replaces MIDI.js)
  playMidiNote(channel, midiNote, velocity = 127, delay = 0) {
    if (!this.isInitialized) {
      if (window.__GS_DEBUG__) console.warn('AudioManager not initialized');
      return false;
    }

    const sampleName = this.midiToSample[midiNote];
    if (!sampleName) {
      console.warn(`No sample mapping for MIDI note: ${midiNote}`);
      return false;
    }

    const normalizedVelocity = Math.max(0, Math.min(1, velocity / 127));
    return this.playSample(sampleName, normalizedVelocity, delay);
  }

  // Modern playback control methods
  async play(grooveData, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('AudioManager not initialized');
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isPlaying = true;
      this.isPaused = false;
      this.playbackStartTime = Date.now();

      // Handle auto speed up
      if (options.autoSpeedUp) {
        this.enableAutoSpeedUp();
      } else {
        this.disableAutoSpeedUp();
      }

      // Start MIDI playback (delegate to existing MIDI system for now)
      if (window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils) {
        window.myGrooveWriter.myGrooveUtils.startMIDI_playback();
      }

      this.scheduleAutoSpeedUp();
    } catch (error) {
      if (window.__GS_DEBUG__) console.error('Failed to start playback:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  pause() {
    if (!this.isInitialized) return;

    this.isPaused = true;
    this.isPlaying = false;
    this.disableAutoSpeedUp();

    // Delegate to existing MIDI system
    if (window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils) {
      window.myGrooveWriter.myGrooveUtils.pauseMIDI_playback();
    }
  }

  stop() {
    if (!this.isInitialized) return;

    this.isPlaying = false;
    this.isPaused = false;
    this.disableAutoSpeedUp();

    // Delegate to existing MIDI system
    if (window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils) {
      window.myGrooveWriter.myGrooveUtils.stopMIDI_playback();
    }
  }

  resume() {
    if (!this.isInitialized || !this.isPaused) return;

    this.isPaused = false;
    this.isPlaying = true;

    // Delegate to existing MIDI system
    if (window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils) {
      window.myGrooveWriter.myGrooveUtils.resumeMIDI_playback();
    }
  }

  setTempo(bpm) {
    this.currentTempo = Math.max(30, Math.min(300, bpm));

    // Update existing MIDI system
    if (window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils) {
      window.myGrooveWriter.myGrooveUtils.setTempo(this.currentTempo);
    }
  }

  getTempo() {
    return this.currentTempo;
  }

  enableAutoSpeedUp(settings = {}) {
    this.autoSpeedUpActive = true;
    this.autoSpeedUpSettings = { ...this.autoSpeedUpSettings, ...settings };
    this.lastSpeedUpTime = Date.now();
  }

  disableAutoSpeedUp() {
    this.autoSpeedUpActive = false;
  }

  scheduleAutoSpeedUp() {
    if (!this.autoSpeedUpActive || !this.isPlaying) return;

    const intervalMs = this.autoSpeedUpSettings.intervalMinutes * 60 * 1000;
    const timeSinceLastSpeedUp = Date.now() - (this.lastSpeedUpTime || this.playbackStartTime);

    if (timeSinceLastSpeedUp >= intervalMs) {
      const newTempo = this.currentTempo + this.autoSpeedUpSettings.bpmAmount;
      this.setTempo(newTempo);
      this.lastSpeedUpTime = Date.now();

      if (window.showNotification) {
        window.showNotification(`Tempo increased to ${newTempo} BPM`, 'info', 2000);
      }
    }

    // Schedule next check
    if (this.autoSpeedUpSettings.keepIncreasing) {
      setTimeout(() => this.scheduleAutoSpeedUp(), 5000); // Check every 5 seconds
    }
  }

  // Modern audio sample playback
  playSample(sampleName, velocity = 1.0, when = 0) {
    if (!this.audioBuffers[sampleName]) {
      console.warn(`Sample not found: ${sampleName}`);
      return false;
    }

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = this.audioBuffers[sampleName];
      gainNode.gain.value = Math.max(0, Math.min(1, velocity));

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const playTime = when || this.audioContext.currentTime;
      source.start(playTime);

      return true;
    } catch (error) {
      console.error(`Failed to play sample ${sampleName}:`, error);
      return false;
    }
  }

  // Get available samples for debugging
  getAvailableSamples() {
    return Object.keys(this.audioBuffers);
  }

  // Get MIDI mapping for debugging
  getMidiMapping() {
    return this.midiToSample;
  }

  // Clean up resources
  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.isInitialized = false;
  }
}
