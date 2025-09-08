/**
/* eslint-disable prettier/prettier, object-shorthand, no-empty, no-console */

 * Modern Audio System for GrooveScribe
 * Standalone version that works without ES6 modules
 * Replaces broken MIDI.js + soundfont system with Web Audio API + MP3 files
 */

(function() {
    'use strict';

    // Early MIDI bootstrap so legacy code can call MIDI.* during page init
    (function bootstrapMidiStubs(){
        try {
            if (!window.MIDI) window.MIDI = {};
            if (!window.MIDI.Player) {
                window.MIDI.Player = {
                    playing: false,
                    BPM: 120,
                    timeWarp: 1,
                    _listeners: [],
                    _loop: false,
                    ctx: { resume: () => Promise.resolve() },
                    loadFile: function(url, cb) { try { typeof cb === 'function' && cb(); } catch(_){} },
                    start: function() { this.playing = true; },
                    stop: function() { this.playing = false; },
                    pause: function() { this.stop(); },
                    resume: function() { if (!this.playing) this.start(); },
                    loop: function(v){ this._loop = !!v; },
                    addListener: function(fn){ if (typeof fn === 'function') this._listeners.push(fn); }
                };
            }
            if (!window.MIDI.loadPlugin) {
                window.MIDI.loadPlugin = function(opts){ try { opts && typeof opts.callback === 'function' && opts.callback(); } catch(_){} };
            }
            if (!window.MIDI.programChange) {
                window.MIDI.programChange = function(){ /* no-op */ };
            }
            if (!window.MIDI.WebAudio) {
                window.MIDI.WebAudio = { noteOn: function(){ return false; }, noteOff: function(){ return true; } };
            }
            if (!window.MIDI.AudioTag) {
                window.MIDI.AudioTag = { noteOn: function(){ return false; }, noteOff: function(){ return true; } };
            }
        } catch (e) {
            // ignore
        }
    })();

    // AudioManager class (standalone version)
    class AudioManager {
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
            this._scheduledSources = new Set();

            // MIDI note to drum sample mapping (GrooveScribe specific)
            this.midiToSample = {
                // Kick
                35: 'kick',           // constant_OUR_MIDI_KICK_NORMAL

                // Snare variations
                38: 'snare_normal',   // constant_OUR_MIDI_SNARE_NORMAL
                21: 'snare_ghost',    // constant_OUR_MIDI_SNARE_GHOST
                22: 'snare_accent',   // constant_OUR_MIDI_SNARE_ACCENT
                37: 'snare_xstick',   // constant_OUR_MIDI_SNARE_XSTICK
                25: 'snare_flam',     // constant_OUR_MIDI_SNARE_FLAM
                23: 'snare_drag',     // constant_OUR_MIDI_SNARE_DRAG
                24: 'snare_buzz',     // constant_OUR_MIDI_SNARE_BUZZ

                // Hi-hat variations
                42: 'hihat_normal',   // constant_OUR_MIDI_HIHAT_NORMAL
                46: 'hihat_open',     // constant_OUR_MIDI_HIHAT_OPEN
                44: 'hihat_foot',     // constant_OUR_MIDI_HIHAT_FOOT
                108: 'hihat_accent',  // new mapping
                26: 'hihat_accent',   // legacy alias (was constant_OUR_MIDI_HIHAT_ACCENT)
                51: 'ride',           // constant_OUR_MIDI_HIHAT_RIDE
                53: 'ride_bell',      // constant_OUR_MIDI_HIHAT_RIDE_BELL
                105: 'cowbell',       // new mapping
                56: 'cowbell',        // legacy alias (was constant_OUR_MIDI_HIHAT_COW_BELL)
                49: 'crash',          // constant_OUR_MIDI_HIHAT_CRASH
                52: 'stacker',        // new mapping
                55: 'stacker',        // legacy alias (was constant_OUR_MIDI_HIHAT_STACKER)

                // Toms
                48: 'tom1',           // constant_OUR_MIDI_TOM1_NORMAL (High Tom)
                47: 'tom2',           // constant_OUR_MIDI_TOM2_NORMAL (Mid Tom)
                45: 'tom3',           // constant_OUR_MIDI_TOM3_NORMAL (Low Tom)
                43: 'tom4',           // constant_OUR_MIDI_TOM4_NORMAL (Floor Tom)

                // Metronome
                76: 'metronome_normal',  // constant_OUR_MIDI_HIHAT_METRONOME_NORMAL
                77: 'metronome_accent'   // constant_OUR_MIDI_HIHAT_METRONOME_ACCENT
            };

            // Sample file name mapping
            this.sampleFiles = {
                'kick': 'Kick.mp3',
                'snare_normal': 'Snare Normal.mp3',
                'snare_ghost': 'Snare Ghost.mp3',
                'snare_accent': 'Snare Accent.mp3',
                'snare_xstick': 'Snare Cross Stick.mp3',
                'snare_flam': 'Snare Flam.mp3',
                'snare_drag': 'Drag.mp3',
                'snare_buzz': 'Buzz.mp3',
                'hihat_normal': 'Hi Hat Normal.mp3',
                'hihat_open': 'Hi Hat Open.mp3',
                'hihat_foot': 'Hi Hat Foot.mp3',
                'hihat_accent': 'Hi Hat Accent.mp3',
                'ride': 'Ride.mp3',
                'ride_bell': 'Bell.mp3',
                'cowbell': 'Cowbell.mp3',
                'crash': 'Crash.mp3',
                'stacker': 'Stacker.mp3',
                'tom1': '10 Tom.mp3',        // High Tom
                'tom2': '16 Tom.mp3',        // Mid Tom
                'tom3': 'Rack Tom.mp3',      // Low Tom
                'tom4': 'Floor Tom.mp3',     // Floor Tom
                'metronome_normal': 'metronomeClick.mp3',
                'metronome_accent': 'metronome1Count.mp3'
            };
        }

        async initialize() {
            try {
                await this.initializeAudioContext();
                await this.loadAudioSamples();
                this.isInitialized = true;
                console.log('Modern AudioManager initialized successfully');
                return true;
            } catch (error) {
                console.warn('AudioManager init deferred:', error && error.message ? error.message : error);
                this.isInitialized = false;
                return false;
            }
        }

        async initializeAudioContext() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) {
                    throw new Error('Web Audio API not supported');
                }

                this.audioContext = new AudioContext();
                // Master chain: voiceGain -> masterGain -> compressor -> destination
                this.masterGainNode = this.audioContext.createGain();
                this.masterGainNode.gain.value = 0.85; // default overall level

                this.masterCompressor = this.audioContext.createDynamicsCompressor();
                try {
                    this.masterCompressor.threshold.value = -20;
                    this.masterCompressor.knee.value = 24;
                    this.masterCompressor.ratio.value = 8;
                    this.masterCompressor.attack.value = 0.003;
                    this.masterCompressor.release.value = 0.25;
                } catch (_) { /* older browsers */ }

                this.masterGainNode.connect(this.masterCompressor);
                this.masterCompressor.connect(this.audioContext.destination);

                // Do not force resume here; wait for user gesture
                // (Autoplay policy). We'll resume on first interaction.

                console.log('Audio context initialized');
            } catch (error) {
                console.warn('Audio context init warning:', error);
                // Allow init() to continue; playback will resume on user gesture
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
                            console.warn(`Failed to load sample: ${sampleName} (${fileName})`);
                            return;
                        }
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                        this.audioBuffers[sampleName] = audioBuffer;
                        console.log(`Loaded sample: ${sampleName}`);
                    } catch (error) {
                        console.warn(`Error loading sample ${sampleName}:`, error);
                    }
                });

                await Promise.all(loadPromises);
                console.log('Audio samples loaded:', Object.keys(this.audioBuffers));
            } catch (error) {
                console.warn('Some audio samples failed to load:', error);
            }
        }

        // Main API method - plays a drum sound by MIDI note number (replaces MIDI.js)
        playMidiNote(channel, midiNote, velocity = 127, delay = 0) {
            if (!this.isInitialized) {
                console.warn('AudioManager not initialized');
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

        // Modern audio sample playback
        playSample(sampleName, velocity = 1.0, when = 0) {
            if (!this.audioBuffers[sampleName]) {
                console.warn(`Sample not found: ${sampleName}`);
                return false;
            }

            try {
                const source = this.audioContext.createBufferSource();
                const voiceGain = this.audioContext.createGain();

                source.buffer = this.audioBuffers[sampleName];
                voiceGain.gain.value = Math.max(0, Math.min(1, velocity));

                source.connect(voiceGain);
                voiceGain.connect(this.masterGainNode);

                const playTime = when || this.audioContext.currentTime;

                // Track scheduled sources for immediate stop/reschedule support
                try {
                    source._gs_gain = voiceGain;
                    source._gs_startAt = playTime;
                    this._scheduledSources.add(source);
                    const cleanup = () => { try { this._scheduledSources.delete(source); } catch(_){} };
                    source.addEventListener('ended', cleanup, { once: true });
                } catch(_) {}

                source.start(playTime);

                return true;

            } catch (error) {
                console.error(`Failed to play sample ${sampleName}:`, error);
                return false;
            }
        }

        stopAllScheduled(fadeMs = 0) {
            try {
                const now = this.audioContext ? this.audioContext.currentTime : 0;
                const dur = Math.max(0, (fadeMs || 0) / 1000);
                for (const src of Array.from(this._scheduledSources)) {
                    try {
                        if (src._gs_gain && this.audioContext) {
                            const g = src._gs_gain.gain;
                            g.cancelScheduledValues(now);
                            if (dur > 0) {
                                g.setTargetAtTime(0, now, dur / 3);
                                src.stop(now + dur + 0.01);
                            } else {
                                src.stop(now);
                            }
                        } else {
                            src.stop();
                        }
                    } catch(_) {}
                    try { this._scheduledSources.delete(src); } catch(_){}
                }
            } catch(_) {}
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
            if (this.audioContext) {
                this.audioContext.close();
            }
            this.isInitialized = false;
        }
    }

    // GrooveScribe Audio Integration
    class GrooveScribeAudio {
        constructor() {
            this.audioManager = null;
            this.initialized = false;
        }

        async init() {
            console.log('Initializing modern audio system...');
            this.audioManager = new AudioManager();

            // Always create the MIDI bridge early so legacy code can use MIDI.* safely
            this.createMidiJsBridge();
            this.replaceBrokenAudioFunctions();
            this.addAudioEnhancements();

            // Initialize audio in background; don't block bridge creation
            const ok = await this.audioManager.initialize();
            if (!ok) {
                console.warn('Modern audio manager not ready yet (will resume after gesture).');
            }
            this.initialized = true;
            console.log('Modern audio system initialized successfully');
        }

        createMidiJsBridge() {
            // Create a modern replacement for MIDI.js that uses our AudioManager
            if (!window.MIDI) {
                window.MIDI = {};
            }

            const self = this;

            // Replace MIDI.WebAudio with our modern system
            window.MIDI.WebAudio = {
                noteOn: (channel, note, velocity, delay) => {
                    if (self.audioManager) {
                        return self.audioManager.playMidiNote(channel, note, velocity, delay);
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
                    if (self.audioManager) {
                        return self.audioManager.playMidiNote(channel, note, velocity, delay);
                    }
                    return false;
                },
                noteOff: () => {
                    return true;
                }
            };

            // Provide a transport Player shim that emits timing events for UI + audio drivers
            (function ensureMidiPlayer() {
                const prev = window.MIDI && window.MIDI.Player ? window.MIDI.Player : null;
                const prevListeners = prev && Array.isArray(prev._listeners) ? prev._listeners.slice() : [];
                const Player = {
                    playing: false,
                    BPM: 120,
                    timeWarp: 1,
                    _loop: false,
                    _listeners: prevListeners,
                    _startTime: 0,
                    _rafId: null,
                    _expectedDurationMs: null,
                    _beatsPerMeasure: 4,
                    _noteValue: 4,
                    _measures: 1,
                    _scheduleCache: null,
                    _schedTimer: null,
                    _schedAheadSec: 0.10,
                    _schedIntervalMs: 100,
                    _schedNextIndex: 0,
                    _schedBarStartCtx: 0,
                    _pendingSetBPM: null,
                    setBPM: function(bpm){ this._pendingSetBPM = bpm; },
                    ctx: {
                        resume: () => {
                            const ac = self.audioManager && self.audioManager.audioContext;
                            return ac && ac.state === 'suspended' ? ac.resume() : Promise.resolve();
                        }
                    },
                    _buildScheduleCache: function() {
                        try {
                            const gw = window.myGrooveWriter;
                            const gu = (gw && gw.myGrooveUtils) || (window.__GS_ACTIVE_UTILS || null);
                            const gd = (gu && gu.myGrooveData) || (window.__GS_ACTIVE_GROOVE || null);
                            if (!(gu && gd)) return null;
                            const HH = gu.scaleNoteArrayToFullSize(gd.hh_array, gd.numberOfMeasures, gd.notesPerMeasure, gd.numBeats, gd.noteValue);
                            const SN = gu.scaleNoteArrayToFullSize(gd.snare_array, gd.numberOfMeasures, gd.notesPerMeasure, gd.numBeats, gd.noteValue);
                            const KI = gu.scaleNoteArrayToFullSize(gd.kick_array, gd.numberOfMeasures, gd.notesPerMeasure, gd.numBeats, gd.noteValue);
                            const TOMS = [];
                            for (let i = 0; i < (gu.constant_NUMBER_OF_TOMS || 4); i++) {
                                TOMS[i] = gu.scaleNoteArrayToFullSize(gd.toms_array[i], gd.numberOfMeasures, gd.notesPerMeasure, gd.numBeats, gd.noteValue);
                            }
                            return { gu, gd, HH, SN, KI, TOMS, length: HH.length };
                        } catch (_) { return null; }
                    },
                    _startAudioScheduler: function() {
                        try {
                            if (!self.audioManager || !self.audioManager.audioContext) return;
                            this._scheduleCache = this._buildScheduleCache();
                            if (!(this._scheduleCache && this._scheduleCache.length)) return;
                            window.__GS_AUDIO_SCHED_ACTIVE = true;
                            const ac = self.audioManager.audioContext;
                            const cache = this._scheduleCache;
                            const beatsPerMeasure = this._beatsPerMeasure || 4;
                            const noteValue = this._noteValue || 4;
                            const getBarSec = () => {
                                const bpm = Math.max(1, this.BPM || 120);
                                return (60 / bpm) * beatsPerMeasure * (4 / noteValue);
                            };
                            this._schedBarStartCtx = ac.currentTime + 0.05;
                            this._schedNextIndex = 0;
                            const scheduleTick = () => {
                                try {
                                    if (!this.playing) return;
                                    const now = ac.currentTime;
                                    const barSec = getBarSec();
                                    const perIdxSec = barSec / cache.length;
                                    const ahead = Math.min(this._schedAheadSec, barSec);
                                    while (true) {
                                        const idxTime = this._schedBarStartCtx + this._schedNextIndex * perIdxSec;
                                    if (idxTime <= now + ahead) {
                                            // Schedule hits at this index
                                            const gi = this._schedNextIndex;
                                            const gu = cache.gu;
                                            const channel = 9;
                                            const velNorm = gu.constant_OUR_MIDI_VELOCITY_NORMAL || 100;
                                            const velAcc = gu.constant_OUR_MIDI_VELOCITY_ACCENT || 120;
                                            const hit = (note, vel) => {
                                                try { window.MIDI.WebAudio.noteOn(channel, note, vel, idxTime); } catch(_){}
                                            };
                                            // HH
                                            switch (cache.HH[gi]) {
                                                case gu.constant_ABC_HH_Normal:
                                                case gu.constant_ABC_HH_Close: hit(gu.constant_OUR_MIDI_HIHAT_NORMAL, velNorm); break;
                                                case gu.constant_ABC_HH_Accent: hit(gu.constant_OUR_MIDI_HIHAT_NORMAL, velAcc); break;
                                                case gu.constant_ABC_HH_Open: hit(gu.constant_OUR_MIDI_HIHAT_OPEN, velNorm); break;
                                                case gu.constant_ABC_HH_Foot: hit(gu.constant_OUR_MIDI_HIHAT_FOOT, velNorm); break;
                                                case gu.constant_ABC_HH_Metronome_Normal: hit(gu.constant_OUR_MIDI_METRONOME_NORMAL || 77, velNorm); break;
                                                case gu.constant_ABC_HH_Metronome_Accent: hit(gu.constant_OUR_MIDI_METRONOME_1 || 76, velAcc); break;
                                                default: break;
                                            }
                                            // SN
                                            switch (cache.SN[gi]) {
                                                case gu.constant_ABC_SN_Normal: hit(gu.constant_OUR_MIDI_SNARE_NORMAL, velNorm); break;
                                                case gu.constant_ABC_SN_Flam: hit(gu.constant_OUR_MIDI_SNARE_FLAM || gu.constant_OUR_MIDI_SNARE_NORMAL, velAcc); break;
                                                case gu.constant_ABC_SN_Accent: hit(gu.constant_OUR_MIDI_SNARE_NORMAL, velAcc); break;
                                                case gu.constant_ABC_SN_Ghost: hit(gu.constant_OUR_MIDI_SNARE_GHOST || gu.constant_OUR_MIDI_SNARE_NORMAL, Math.max(10, Math.floor(velNorm * 0.5))); break;
                                                case gu.constant_ABC_SN_XStick: hit(gu.constant_OUR_MIDI_SNARE_XSTICK, velNorm); break;
                                                case gu.constant_ABC_SN_Drag: hit(gu.constant_OUR_MIDI_SNARE_DRAG || gu.constant_OUR_MIDI_SNARE_NORMAL, velNorm); break;
                                                case gu.constant_ABC_SN_Buzz: hit(gu.constant_OUR_MIDI_SNARE_BUZZ || gu.constant_OUR_MIDI_SNARE_NORMAL, velNorm); break;
                                                default: break;
                                            }
                                            // KICK
                                            switch (cache.KI[gi]) {
                                                case gu.constant_ABC_KI_Splash: hit(gu.constant_OUR_MIDI_HIHAT_FOOT, velNorm); break;
                                                case gu.constant_ABC_KI_SandK: hit(gu.constant_OUR_MIDI_HIHAT_FOOT, velNorm); hit(gu.constant_OUR_MIDI_KICK_NORMAL, velNorm); break;
                                                case gu.constant_ABC_KI_Normal: hit(gu.constant_OUR_MIDI_KICK_NORMAL, velNorm); break;
                                                default: break;
                                            }
                                            // TOMS
                                            if (cache.TOMS) {
                                                for (let t = 0; t < (gu.constant_NUMBER_OF_TOMS || 4); t++) {
                                                    const tv = cache.TOMS[t][gi];
                                                    switch (tv) {
                                                        case gu.constant_ABC_T1_Normal: hit(gu.constant_OUR_MIDI_TOM1_NORMAL, velNorm); break;
                                                        case gu.constant_ABC_T2_Normal: hit(gu.constant_OUR_MIDI_TOM2_NORMAL, velNorm); break;
                                                        case gu.constant_ABC_T3_Normal: hit(gu.constant_OUR_MIDI_TOM3_NORMAL, velNorm); break;
                                                        case gu.constant_ABC_T4_Normal: hit(gu.constant_OUR_MIDI_TOM4_NORMAL, velNorm); break;
                                                        default: break;
                                                    }
                                                }
                                            }
                                            this._schedNextIndex++;
                                            if (this._schedNextIndex >= cache.length) {
                                                if (this._loop) {
                                                    // Apply any pending BPM change exactly at bar boundary
                                                    if (this._pendingSetBPM != null) {
                                                        this.BPM = this._pendingSetBPM;
                                                        this._pendingSetBPM = null;
                                                    }
                                                    this._schedNextIndex = 0;
                                                    this._schedBarStartCtx += barSec;
                                                } else {
                                                    // No loop: stop after finishing scheduling the bar
                                                    this.stop();
                                                    return;
                                                }
                                            }
                                        } else {
                                            break;
                                        }
                                    }
                                } catch(_){}
                            };
                            // Kick off scheduling
                            scheduleTick();
                            this._schedTimer = setInterval(scheduleTick, this._schedIntervalMs);
                        } catch(_) {}
                    },
                    _stopAudioScheduler: function() {
                        try { if (this._schedTimer) clearInterval(this._schedTimer); } catch(_){}
                        this._schedTimer = null;
                        window.__GS_AUDIO_SCHED_ACTIVE = false;
                    },
                    loadFile: function(url, cb) {
                        // Compute expected duration from current groove if available
                        try {
                            const gw = window.myGrooveWriter;
                            const gu = (gw && gw.myGrooveUtils) || (window.__GS_ACTIVE_UTILS || null);
                            const gd = (gu && gu.myGrooveData) || (window.__GS_ACTIVE_GROOVE || null);
                            const bpm = Math.max(1, this.BPM || (gd && gd.tempo) || 120);
                            const beatsPerMeasure = (gd && gd.numBeats) || 4;
                            const noteValue = (gd && gd.noteValue) || 4;
                            const measures = (gd && gd.numberOfMeasures) || 1;
                            const measureSec = (60 / bpm) * beatsPerMeasure * (4 / noteValue);
                            const totalSec = (measureSec * measures);
                            this._expectedDurationMs = Math.max(500, Math.round(totalSec * 1000));
                            this._beatsPerMeasure = beatsPerMeasure;
                            this._noteValue = noteValue;
                            this._measures = measures;
                        } catch (_) {}
                        try { typeof cb === 'function' && cb(); } catch(_){}
                    },
                    start: function() {
                        this.playing = true;
                        this._startTime = performance.now();
                        this._stopAudioScheduler();
                        this._startAudioScheduler();
                        const selfP = this;
                        const tick = () => {
                            if (!selfP.playing) return;
                            const now = performance.now();
                            const elapsedMs = now - selfP._startTime;
                            const approxDurationMs = selfP._expectedDurationMs || 3000;
                            // Emit a simple note event periodically for UI hooks (MIDI.js expects ms)
                            const evt = { message: 144, note: 42, channel: 9, velocity: 100, now: elapsedMs, end: approxDurationMs };
                            selfP._listeners.forEach(fn => { try { fn(evt); } catch (_) {} });
                            if (elapsedMs >= approxDurationMs) {
                                if (selfP._loop) {
                                    // Emit a completion event (now==end) so listeners can react to bar end (e.g., Auto Speed Up)
                                    try {
                                        const endEvt = { message: 144, note: 42, channel: 9, velocity: 100, now: approxDurationMs, end: approxDurationMs };
                                        selfP._listeners.forEach(fn => { try { fn(endEvt); } catch (_) {} });
                                    } catch (_) {}
                                    // Immediately emit a wrap tick at bar start to avoid perceived lag on first hit
                                    try {
                                        const wrapEvt = { message: 144, note: 42, channel: 9, velocity: 100, now: 0, end: approxDurationMs };
                                        selfP._listeners.forEach(fn => { try { fn(wrapEvt); } catch (_) {} });
                                    } catch (_) {}
                                    // Preserve phase continuity by advancing by the exact period
                                    selfP._startTime += approxDurationMs;
                                } else {
                                    selfP.stop();
                                    return;
                                }
                            }
                            selfP._rafId = requestAnimationFrame(tick);
                        };
                        this._rafId = requestAnimationFrame(tick);
                    },
                    stop: function() {
                        this.playing = false;
                        if (this._rafId) cancelAnimationFrame(this._rafId);
                        this._rafId = null;
                        this._stopAudioScheduler();
                        try { self.audioManager && self.audioManager.stopAllScheduled(30); } catch(_){}
                    },
                    pause: function() { this.stop(); },
                    resume: function() { if (!this.playing) this.start(); },
                    loop: function(v) { this._loop = !!v; },
                    addListener: function(fn){ if (typeof fn === 'function') this._listeners.push(fn); }
                };
                window.MIDI.Player = Player;
            })();

            console.log('MIDI.js bridge created successfully');
        }

        replaceBrokenAudioFunctions() {
            const self = this;

            // Replace the global play_single_note_for_note_setting function
            window.play_single_note_for_note_setting = (note_val) => {
                if (self.audioManager) {
                    return self.audioManager.playMidiNote(9, note_val, 127, 0);
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

                // Add immediate audio context resume on user interaction
                const resumeAudioContext = async () => {
                    if (this.audioManager.audioContext && this.audioManager.audioContext.state === 'suspended') {
                        try {
                            await this.audioManager.audioContext.resume();
                            console.log('Audio context resumed');
                        } catch (error) {
                            console.error('Failed to resume audio context:', error);
                        }
                    }
                };

                // Resume audio context on first user interaction
                document.addEventListener('click', resumeAudioContext, { once: true });
                document.addEventListener('keydown', resumeAudioContext, { once: true });
                document.addEventListener('touchstart', resumeAudioContext, { once: true });

                // Expose helpers to tweak master chain
                window.setMasterGain = (g) => {
                    try {
                        const val = Math.max(0.1, Math.min(1.0, Number(g)));
                        this.audioManager.masterGainNode.gain.value = val;
                        console.log('[ModernAudio] master gain:', val);
                        return val;
                    } catch (_) { /* ignore */ }
                };
                window.setCompressor = (cfg) => {
                    try {
                        const c = this.audioManager.masterCompressor;
                        if (!c) return;
                        if (cfg.threshold != null) c.threshold.value = cfg.threshold;
                        if (cfg.knee != null) c.knee.value = cfg.knee;
                        if (cfg.ratio != null) c.ratio.value = cfg.ratio;
                        if (cfg.attack != null) c.attack.value = cfg.attack;
                        if (cfg.release != null) c.release.value = cfg.release;
                        console.log('[ModernAudio] compressor updated', cfg);
                    } catch (_) { /* ignore */ }
                };
            }
        }
    }

    // Initialize the modern audio system when DOM is ready
    function initializeModernAudio() {
        const grooveScribeAudio = new GrooveScribeAudio();

        // Wait for page to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => grooveScribeAudio.init(), 500);
            });
        } else {
            setTimeout(() => grooveScribeAudio.init(), 500);
        }

        // Make it globally accessible
        window.grooveScribeAudio = grooveScribeAudio;
    }

    // Start initialization
    initializeModernAudio();

})();
