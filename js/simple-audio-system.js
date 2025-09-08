/**
 * Simple Audio System for GrooveScribe
 * Uses HTML5 Audio elements to work with local file:// URLs
 * Replaces broken MIDI.js + soundfont system
 */

(function() {
    'use strict';

    // Provide immediate, minimal MIDI.js stubs to avoid ReferenceError before init
    (function bootstrapMidiStubs(){
        try {
            console.log('Simple Audio bootstrap START', Date.now());
            if (!window.MIDI) window.MIDI = {};
            if (!window.MIDI.Player) {
                window.MIDI.Player = {
                    playing: false,
                    BPM: 120,
                    timeWarp: 1,
                    _listeners: [],
                    _loop: false,
                    ctx: { resume: function(){} },
                    loadFile: function(/*url, cb*/) { /* no-op until bridge ready */ },
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
                window.MIDI.WebAudio = {
                    noteOn: function(channel, note, velocity, delay){
                        const mgr = (window.grooveScribeSimpleAudio && window.grooveScribeSimpleAudio.audioManager);
                        return mgr ? mgr.playMidiNote(channel, note, velocity, delay) : false;
                    },
                    noteOff: function(){ return true; },
                    chordOn: function(){ return true; }
                };
            }
            if (!window.MIDI.AudioTag) {
                window.MIDI.AudioTag = {
                    noteOn: function(channel, note, velocity, delay){
                        const mgr = (window.grooveScribeSimpleAudio && window.grooveScribeSimpleAudio.audioManager);
                        return mgr ? mgr.playMidiNote(channel, note, velocity, delay) : false;
                    },
                    noteOff: function(){ return true; }
                };
            }
            console.log('MIDI stubs ready');
            console.log('Simple Audio bootstrap END', Date.now());
        } catch (e) {
            console.warn('Simple Audio bootstrap ERROR', e);
            // If stubs fail, ensure MIDI exists to avoid ReferenceError later
            if (!window.MIDI) window.MIDI = {};
            if (!window.MIDI.Player) window.MIDI.Player = { playing:false, BPM:120, timeWarp:1, _listeners:[], _loop:false,
                ctx:{resume:function(){}}, loadFile:function(){}, start:function(){this.playing=true;}, stop:function(){this.playing=false;},
                pause:function(){this.stop();}, resume:function(){ if(!this.playing) this.start(); }, loop:function(v){ this._loop=!!v; }, addListener:function(fn){ if(typeof fn==='function') this._listeners.push(fn); }
            };
            if (!window.MIDI.WebAudio) window.MIDI.WebAudio = { noteOn:function(){return false;}, noteOff:function(){return true;}, chordOn:function(){return true;} };
        }
    })();

    // Simple AudioManager using HTML5 Audio
    class SimpleAudioManager {
        constructor() {
            this.isInitialized = false;
            this.audioElements = {};
            this.loadedSamples = 0;
            this.totalSamples = 0;
            this.masterGain = 0.6; // global gain to avoid clipping
            this.activePlays = 0;   // number of concurrently playing clones
            this.sampleActive = {}; // per-sample concurrent count
            
            // MIDI note to drum sample mapping (GrooveScribe specific)
            this.midiToSample = {
                // Kick
                35: 'kick',           // constant_OUR_MIDI_KICK_NORMAL
                
                // Snare variations
                38: 'snare_normal',   // constant_OUR_MIDI_SNARE_NORMAL
                21: 'snare_ghost',    // constant_OUR_MIDI_SNARE_GHOST
                22: 'snare_accent',   // constant_OUR_MIDI_SNARE_ACCENT
                37: 'snare_xstick',   // constant_OUR_MIDI_SNARE_XSTICK
                107: 'snare_flam',    // constant_OUR_MIDI_SNARE_FLAM (custom mapping)
                25: 'snare_flam',     // legacy alias
                103: 'snare_drag',    // constant_OUR_MIDI_SNARE_DRAG (custom mapping)
                23: 'snare_drag',     // legacy alias
                104: 'snare_buzz',    // constant_OUR_MIDI_SNARE_BUZZ (custom mapping)
                24: 'snare_buzz',     // legacy alias
                
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
                
                // Metronome (map 76 to 1-count accent, 77 to regular click)
                76: 'metronome_accent',  // constant_OUR_MIDI_METRONOME_1
                77: 'metronome_normal'   // constant_OUR_MIDI_METRONOME_NORMAL
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
                console.log('Initializing Simple Audio Manager...');
                await this.loadAudioElements();
                this.isInitialized = true;
                console.log('Simple Audio Manager initialized successfully');
                console.log(`Loaded ${this.loadedSamples}/${this.totalSamples} audio samples`);
                return true;
            } catch (error) {
                console.error('Failed to initialize Simple Audio Manager:', error);
                return false;
            }
        }

        async loadAudioElements() {
            const basePath = 'soundfont/NewDrumSamples/MP3/';
            this.totalSamples = Object.keys(this.sampleFiles).length;
            this.loadedSamples = 0;

            const loadPromises = Object.entries(this.sampleFiles).map(([sampleName, fileName]) => {
                return new Promise((resolve) => {
                    const audio = new Audio();
                    const url = basePath + fileName;
                    
                    audio.addEventListener('canplaythrough', () => {
                        this.audioElements[sampleName] = audio;
                        this.loadedSamples++;
                        console.log(`Loaded audio sample: ${sampleName}`);
                        resolve(true);
                    });
                    
                    audio.addEventListener('error', (e) => {
                        console.warn(`Failed to load audio sample: ${sampleName} (${fileName})`);
                        resolve(false);
                    });
                    
                    // Set audio properties for better performance
                    audio.preload = 'auto';
                    audio.volume = 1.0;
                    
                    // Start loading
                    audio.src = url;
                    audio.load();
                });
            });

            await Promise.all(loadPromises);
            console.log(`Audio loading complete: ${this.loadedSamples}/${this.totalSamples} samples loaded`);
        }

        // Main API method - plays a drum sound by MIDI note number
        playMidiNote(channel, midiNote, velocity = 127, delay = 0) {
            if (!this.isInitialized) {
                console.warn('Simple Audio Manager not initialized');
                return false;
            }

            const sampleName = this.midiToSample[midiNote];
            if (!sampleName) {
                console.warn(`No sample mapping for MIDI note: ${midiNote}`);
                return false;
            }

            const normalizedVelocity = Math.max(0.1, Math.min(1.0, velocity / 127));
            return this.playSample(sampleName, normalizedVelocity, delay);
        }

        // Play audio sample using HTML5 Audio
        playSample(sampleName, velocity = 1.0, delay = 0) {
            const audio = this.audioElements[sampleName];
            if (!audio) {
                console.warn(`Audio sample not found: ${sampleName}`);
                return false;
            }

            try {
                // Clone the audio element to allow overlapping plays
                const audioClone = audio.cloneNode();
                // Support either normalized velocity (0..1) or MIDI (0..127)
                let vol;
                if (typeof velocity !== 'number') {
                    vol = 1.0;
                } else if (velocity > 1) {
                    // Treat as MIDI scale 0..127
                    vol = Math.max(0.1, Math.min(1.0, velocity / 127));
                } else {
                    // Already normalized 0..1
                    vol = Math.max(0.1, Math.min(1.0, velocity));
                }
                // Apply master gain and simple concurrency-based scaling to reduce clipping
                const currentActive = this.activePlays || 0;
                const perSampleActive = this.sampleActive[sampleName] || 0;
                // Dampen by sqrt of concurrent plays to keep energy reasonable
                const concurrencyScale = 1 / Math.sqrt(Math.max(1, currentActive + perSampleActive));
                const finalVol = Math.max(0.0, Math.min(1.0, vol * this.masterGain * concurrencyScale));
                audioClone.volume = finalVol;

                // Track concurrency; clean up on end
                this.activePlays = (this.activePlays || 0) + 1;
                this.sampleActive[sampleName] = perSampleActive + 1;
                const onEnded = () => {
                    audioClone.removeEventListener('ended', onEnded);
                    this.activePlays = Math.max(0, (this.activePlays || 1) - 1);
                    this.sampleActive[sampleName] = Math.max(0, (this.sampleActive[sampleName] || 1) - 1);
                };
                audioClone.addEventListener('ended', onEnded);
                
                if (delay > 0) {
                    setTimeout(() => {
                        audioClone.play().catch(e => console.warn(`Play failed for ${sampleName}:`, e));
                    }, delay * 1000);
                } else {
                    audioClone.play().catch(e => console.warn(`Play failed for ${sampleName}:`, e));
                }
                
                return true;
            } catch (error) {
                console.error(`Failed to play sample ${sampleName}:`, error);
                return false;
            }
        }

        // Get available samples for debugging
        getAvailableSamples() {
            return Object.keys(this.audioElements);
        }

        // Get MIDI mapping for debugging
        getMidiMapping() {
            return this.midiToSample;
        }

        // Get loading status
        getLoadingStatus() {
            return {
                loaded: this.loadedSamples,
                total: this.totalSamples,
                percentage: Math.round((this.loadedSamples / this.totalSamples) * 100)
            };
        }
    }

    // GrooveScribe Audio Integration
    class GrooveScribeSimpleAudio {
        constructor() {
            this.audioManager = null;
            this.initialized = false;
        }

        async init() {
            try {
                console.log('Initializing simple audio system...');
                this.audioManager = new SimpleAudioManager();
                const success = await this.audioManager.initialize();
                
                if (success) {
                    // Create MIDI.js bridge for backward compatibility
                    this.createMidiJsBridge();
                    
                    // Replace the broken play_single_note_for_note_setting function
                    this.replaceBrokenAudioFunctions();
                    
                    // Add modern enhancements
                    this.addAudioEnhancements();
                    
                    this.initialized = true;
                    console.log('Simple audio system initialized successfully');
                } else {
                    console.warn('Simple audio system initialization failed');
                }
                
            } catch (error) {
                console.error('Failed to initialize simple audio system:', error);
            }
        }

        createMidiJsBridge() {
            // Create a replacement for MIDI.js that uses our Simple Audio Manager
            if (!window.MIDI) {
                window.MIDI = {};
            }

            const self = this;

            // Replace MIDI.WebAudio with our simple system
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

            // Minimal MIDI.Player shim to maintain compatibility (replace any previous stub)
            (function ensureMidiPlayer() {
                const prev = window.MIDI && window.MIDI.Player ? window.MIDI.Player : null;
                const prevListeners = prev && Array.isArray(prev._listeners) ? prev._listeners.slice() : [];
                const Player = {
                    playing: false,
                    BPM: 120,
                    timeWarp: 1,
                    _loop: false,
                    _listeners: prevListeners,
                    // Marker so UI logic can adapt when using this shim
                    isSimpleAudioShim: true,
                    _startTime: 0,
                    _rafId: null,
                    _expectedDurationMs: null,
                    _beatsPerMeasure: 4,
                    _noteValue: 4,
                    _measures: 1,
                    _countInSec: 0,
                    _metronomeFrequency: 0,
                    _lastBeatIdx: -1,
                    _lastUnitIdx: -1,
                    ctx: { resume: () => Promise.resolve() },
                    // Toggle whether this shim emits transport audio itself.
                    // When false, audio is driven by GrooveUtils.percentProgress (recommended).
                    _emitAudio: false,
                    loadFile: function(url, cb) {
                        this._midiUrl = url; // We don't parse; simple shim
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
                            this._countInSec = 0; // start transport audio immediately (no separate count-in in shim)
                            this._metronomeFrequency = (gd && gd.metronomeFrequency) || 0;

                            // Build a schedule cache from the current groove arrays (scaled to full size)
                            if (gu && gd) {
                                const HH = gu.scaleNoteArrayToFullSize(gd.hh_array, gd.numberOfMeasures, gd.notesPerMeasure, gd.numBeats, gd.noteValue);
                                const SN = gu.scaleNoteArrayToFullSize(gd.snare_array, gd.numberOfMeasures, gd.notesPerMeasure, gd.numBeats, gd.noteValue);
                                const KI = gu.scaleNoteArrayToFullSize(gd.kick_array, gd.numberOfMeasures, gd.notesPerMeasure, gd.numBeats, gd.noteValue);
                                const TOMS = [];
                                for (let i = 0; i < (gu.constant_NUMBER_OF_TOMS || 4); i++) {
                                    TOMS[i] = gu.scaleNoteArrayToFullSize(gd.toms_array[i], gd.numberOfMeasures, gd.notesPerMeasure, gd.numBeats, gd.noteValue);
                                }
                                const mapping = gu.create_note_mapping_array_for_highlighting(HH, SN, KI, gd.showToms ? TOMS : null, HH.length);
                                this._scheduleCache = { HH, SN, KI, TOMS: gd.showToms ? TOMS : null, mapping, length: HH.length };
                                this._lastIdx = -1;
                                console.log('[Player] loadFile -> scheduleCache', { len: HH.length, bpm, beatsPerMeasure, noteValue, measures });
                            } else {
                                this._scheduleCache = null;
                                this._lastIdx = -1;
                                console.warn('[Player] loadFile -> missing gu/gd, no schedule built');
                                // Schedule a short retry loop to build when utils/data are ready
                                const self = this;
                                let attempts = 0;
                                const maxAttempts = 60; // ~3s at 50ms
                                (function tryBuildSoon(){
                                    attempts++;
                                    const gw2 = window.myGrooveWriter;
                                    const gu2 = (gw2 && gw2.myGrooveUtils) || (window.__GS_ACTIVE_UTILS || null);
                                    const gd2 = (gu2 && gu2.myGrooveData) || (window.__GS_ACTIVE_GROOVE || null);
                                    if (gu2 && gd2) {
                                        try {
                                            const HH = gu2.scaleNoteArrayToFullSize(gd2.hh_array, gd2.numberOfMeasures, gd2.notesPerMeasure, gd2.numBeats, gd2.noteValue);
                                            const SN = gu2.scaleNoteArrayToFullSize(gd2.snare_array, gd2.numberOfMeasures, gd2.notesPerMeasure, gd2.numBeats, gd2.noteValue);
                                            const KI = gu2.scaleNoteArrayToFullSize(gd2.kick_array, gd2.numberOfMeasures, gd2.notesPerMeasure, gd2.numBeats, gd2.noteValue);
                                            const TOMS = [];
                                            for (let i = 0; i < (gu2.constant_NUMBER_OF_TOMS || 4); i++) {
                                                TOMS[i] = gu2.scaleNoteArrayToFullSize(gd2.toms_array[i], gd2.numberOfMeasures, gd2.notesPerMeasure, gd2.numBeats, gd2.noteValue);
                                            }
                                            const mapping = gu2.create_note_mapping_array_for_highlighting(HH, SN, KI, gd2.showToms ? TOMS : null, HH.length);
                                            self._scheduleCache = { HH, SN, KI, TOMS: gd2.showToms ? TOMS : null, mapping, length: HH.length };
                                            if (!self._expectedDurationMs) {
                                                const bpm2 = Math.max(1, self.BPM || (gd2 && gd2.tempo) || 120);
                                                const measureSec2 = (60 / bpm2) * ((gd2 && gd2.numBeats) || 4) * (4 / ((gd2 && gd2.noteValue) || 4));
                                                self._expectedDurationMs = Math.max(500, Math.round(measureSec2 * ((gd2 && gd2.numberOfMeasures) || 1) * 1000));
                                            }
                                            console.log('[Player] retry schedule build success', { len: self._scheduleCache.length, attempts });
                                            return; // done
                                        } catch (e) {
                                            // fall through and retry
                                        }
                                    }
                                    if (attempts < maxAttempts) setTimeout(tryBuildSoon, 50);
                                    else console.warn('[Player] retry schedule build gave up');
                                })();
                            }
                        } catch (_) {
                            this._expectedDurationMs = null;
                            this._scheduleCache = null;
                            this._lastIdx = -1;
                        }
                        if (typeof cb === 'function') {
                            try { cb(); } catch (e) { /* ignore */ }
                        }
                        console.log('[Player] loadFile complete');
                    },
                    addListener: function(fn) {
                        if (typeof fn === 'function') this._listeners.push(fn);
                    },
                    loop: function(enable) { this._loop = !!enable; },
                    start: function() {
                        if (this.playing) return;
                        this.playing = true;
                        this._startTime = performance.now();
                        this._lastBeatIdx = -1;
                        console.log('[Player] start called', { hasCache: !!this._scheduleCache, cacheLen: this._scheduleCache && this._scheduleCache.length, expectedMs: this._expectedDurationMs });
                        const tick = () => {
                            if (!this.playing) return;
                            const now = performance.now();
                            const elapsedMs = (now - this._startTime); // milliseconds
                            if (!this._tickLogged) { console.log('[Player] tick first frame', { elapsedMs, hasCache: !!this._scheduleCache, cacheLen: this._scheduleCache && this._scheduleCache.length }); this._tickLogged = true; }
                            // Fake duration based on tempo (approx 60s track at 120 BPM)
                            const approxDurationSec = Math.max(5, 60 * (120 / Math.max(1, this.BPM)));
                            const approxDurationMs = this._expectedDurationMs || (approxDurationSec * 1000);

                            // Emit a simple note event periodically for UI hooks (MIDI.js expects ms)
                            const evt = { message: 144, note: 42, channel: 9, velocity: 100, now: elapsedMs, end: approxDurationMs };
                            this._listeners.forEach(fn => { try { fn(evt); } catch (_) {} });

                            // Ensure schedule cache exists (lazy-build in case utils not ready during loadFile)
                            if (!this._scheduleCache) {
                                const gwx = window.myGrooveWriter;
                                const gux = (gwx && gwx.myGrooveUtils) || (window.__GS_ACTIVE_UTILS || null);
                                const gdx = (gux && gux.myGrooveData) || (window.__GS_ACTIVE_GROOVE || null);
                                if (gux && gdx) {
                                    try {
                                        const HH = gux.scaleNoteArrayToFullSize(gdx.hh_array, gdx.numberOfMeasures, gdx.notesPerMeasure, gdx.numBeats, gdx.noteValue);
                                        const SN = gux.scaleNoteArrayToFullSize(gdx.snare_array, gdx.numberOfMeasures, gdx.notesPerMeasure, gdx.numBeats, gdx.noteValue);
                                        const KI = gux.scaleNoteArrayToFullSize(gdx.kick_array, gdx.numberOfMeasures, gdx.notesPerMeasure, gdx.numBeats, gdx.noteValue);
                                        const TOMS = [];
                                        for (let i = 0; i < (gux.constant_NUMBER_OF_TOMS || 4); i++) {
                                            TOMS[i] = gux.scaleNoteArrayToFullSize(gdx.toms_array[i], gdx.numberOfMeasures, gdx.notesPerMeasure, gdx.numBeats, gdx.noteValue);
                                        }
                                        const mapping = gux.create_note_mapping_array_for_highlighting(HH, SN, KI, gdx.showToms ? TOMS : null, HH.length);
                                        this._scheduleCache = { HH, SN, KI, TOMS: gdx.showToms ? TOMS : null, mapping, length: HH.length };
                                        this._lastIdx = -1;
                                        if (!this._expectedDurationMs) {
                                            const bpm = Math.max(1, this.BPM || (gdx && gdx.tempo) || 120);
                                            const beatsPerMeasure = (gdx && gdx.numBeats) || 4;
                                            const noteValue = (gdx && gdx.noteValue) || 4;
                                            const measures = (gdx && gdx.numberOfMeasures) || 1;
                                            const measureSec = (60 / bpm) * beatsPerMeasure * (4 / noteValue);
                                            const totalSec = (measureSec * measures);
                                            this._expectedDurationMs = Math.max(500, Math.round(totalSec * 1000));
                                        }
                                        console.log('[Player] late schedule build', { len: this._scheduleCache.length });
                                    } catch (__) {}
                                }
                            }

                            // Drive actual drum hits only if enabled; otherwise,
                            // percentProgress() in GrooveUtils will handle audio.
                            if (this._emitAudio) {
                                const gu = (window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils) || (window.__GS_ACTIVE_UTILS || null);
                                const cache = this._scheduleCache;
                                if (gu && cache && cache.length) {
                                    const effectiveMs = Math.max(1, approxDurationMs);
                                    const timelineMs = elapsedMs;
                                    const ratio = Math.max(0, Math.min(1, timelineMs / effectiveMs));
                                    const curIdx = Math.min(cache.length - 1, Math.floor(ratio * cache.length));
                                    const channel = 9;
                                    const velNorm = gu.constant_OUR_MIDI_VELOCITY_NORMAL || 100;
                                    const velAcc = gu.constant_OUR_MIDI_VELOCITY_ACCENT || 120;
                                    const self = this; let dbg = self._dbgCount || 0; const shouldLog = dbg < 8;
                                    const hit = (note, vel, idx) => {
                                        if (window.MIDI && window.MIDI.WebAudio) {
                                            try {
                                                window.MIDI.WebAudio.noteOn(channel, note, vel, 0);
                                                if (shouldLog) { console.log('[transport] noteOn', {note, vel, idx}); self._dbgCount = ++dbg; }
                                            } catch (__) {}
                                        }
                                    };
                                    for (let i = (this._lastIdx || -1) + 1; i <= curIdx; i++) {
                                        switch (cache.HH[i]) {
                                            case gu.constant_ABC_HH_Normal:
                                            case gu.constant_ABC_HH_Close: hit(gu.constant_OUR_MIDI_HIHAT_NORMAL, velNorm); break;
                                            case gu.constant_ABC_HH_Accent: hit(gu.constant_OUR_MIDI_HIHAT_NORMAL, velAcc); break;
                                            case gu.constant_ABC_HH_Open: hit(gu.constant_OUR_MIDI_HIHAT_OPEN, velNorm); break;
                                            case gu.constant_ABC_HH_Foot: hit(gu.constant_OUR_MIDI_HIHAT_FOOT, velNorm); break;
                                            case gu.constant_ABC_HH_Metronome_Normal: hit(gu.constant_OUR_MIDI_METRONOME_NORMAL || 77, velNorm); break;
                                            case gu.constant_ABC_HH_Metronome_Accent: hit(gu.constant_OUR_MIDI_METRONOME_1 || 76, velAcc); break;
                                            default: break;
                                        }
                                        switch (cache.SN[i]) {
                                            case gu.constant_ABC_SN_Normal: hit(gu.constant_OUR_MIDI_SNARE_NORMAL, velNorm, i); break;
                                            case gu.constant_ABC_SN_Flam: hit(gu.constant_OUR_MIDI_SNARE_FLAM || gu.constant_OUR_MIDI_SNARE_NORMAL, velAcc, i); break;
                                            case gu.constant_ABC_SN_Accent: hit(gu.constant_OUR_MIDI_SNARE_NORMAL, velAcc, i); break;
                                            case gu.constant_ABC_SN_Ghost: hit(gu.constant_OUR_MIDI_SNARE_GHOST || gu.constant_OUR_MIDI_SNARE_NORMAL, Math.max(10, Math.floor(velNorm * 0.5)), i); break;
                                            case gu.constant_ABC_SN_XStick: hit(gu.constant_OUR_MIDI_SNARE_XSTICK, velNorm, i); break;
                                            case gu.constant_ABC_SN_Drag: hit(gu.constant_OUR_MIDI_SNARE_DRAG || gu.constant_OUR_MIDI_SNARE_NORMAL, velNorm, i); break;
                                            case gu.constant_ABC_SN_Buzz: hit(gu.constant_OUR_MIDI_SNARE_BUZZ || gu.constant_OUR_MIDI_SNARE_NORMAL, velNorm, i); break;
                                            default: break;
                                        }
                                        switch (cache.KI[i]) {
                                            case gu.constant_ABC_KI_Splash: hit(gu.constant_OUR_MIDI_HIHAT_FOOT, velNorm, i); break;
                                            case gu.constant_ABC_KI_SandK: hit(gu.constant_OUR_MIDI_HIHAT_FOOT, velNorm, i); hit(gu.constant_OUR_MIDI_KICK_NORMAL, velNorm, i); break;
                                            case gu.constant_ABC_KI_Normal: hit(gu.constant_OUR_MIDI_KICK_NORMAL, velNorm, i); break;
                                            default: break;
                                        }
                                        if (cache.TOMS) {
                                            for (let t = 0; t < (gu.constant_NUMBER_OF_TOMS || 4); t++) {
                                                const tv = cache.TOMS[t][i];
                                                switch (tv) {
                                                    case gu.constant_ABC_T1_Normal: hit(gu.constant_OUR_MIDI_TOM1_NORMAL, velNorm, i); break;
                                                    case gu.constant_ABC_T2_Normal: hit(gu.constant_OUR_MIDI_TOM2_NORMAL, velNorm); break;
                                                    case gu.constant_ABC_T3_Normal: hit(gu.constant_OUR_MIDI_TOM3_NORMAL, velNorm); break;
                                                    case gu.constant_ABC_T4_Normal: hit(gu.constant_OUR_MIDI_TOM4_NORMAL, velNorm); break;
                                                    default: break;
                                                }
                                            }
                                        }
                                    }
                                    this._lastIdx = curIdx;
                                }
                            }

                            // Metronome temporarily disabled to resolve parse error; will re-enable after transport is stable

                            if (elapsedMs >= approxDurationMs) {
                                if (this._loop) {
                                    // Preserve phase continuity by advancing start by exact period
                                    this._startTime += approxDurationMs;
                                    this._lastBeatIdx = -1;
                                } else {
                                    this.stop();
                                    return;
                                }
                            }
                            this._rafId = requestAnimationFrame(tick);
                        };
                        this._rafId = requestAnimationFrame(tick);
                    },
                    stop: function() {
                        this.playing = false;
                        if (this._rafId) cancelAnimationFrame(this._rafId);
                        this._rafId = null;
                    },
                    pause: function() { this.stop(); },
                    resume: function() { if (!this.playing) this.start(); }
                };
                if (!window.MIDI) window.MIDI = {};
                window.MIDI.Player = Player;
            })();

            // Provide loadPlugin/programChange no-ops for compatibility
            if (!window.MIDI.loadPlugin) {
                window.MIDI.loadPlugin = function(opts) {
                    try { if (opts && typeof opts.callback === 'function') opts.callback(); } catch (_) {}
                };
            }
            if (!window.MIDI.programChange) {
                window.MIDI.programChange = function(/*channel, program*/){ return; };
            }

            console.log('MIDI.js bridge created successfully (Simple Audio)');
        }

        replaceBrokenAudioFunctions() {
            const self = this;
            
            // Replace the global play_single_note_for_note_setting function
            window.play_single_note_for_note_setting = (note_val) => {
                if (self.audioManager && self.audioManager.isInitialized) {
                    return self.audioManager.playMidiNote(9, note_val, 127, 0);
                } else {
                    console.warn('Simple Audio Manager not available');
                    return false;
                }
            };

            console.log('Audio functions replaced with simple implementation');
        }

        addAudioEnhancements() {
            // Add audio enhancements
            if (this.audioManager) {
                // Expose audio manager globally for debugging
                window.simpleAudioManager = this.audioManager;
                window.modernAudioManager = this.audioManager; // For compatibility with tests
                
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

                // Allow adjusting master gain from console/tests
                window.setMasterGain = (g) => {
                    try {
                        const val = Math.max(0.1, Math.min(1.0, Number(g)));
                        this.audioManager.masterGain = val;
                        console.log('[Audio] masterGain set to', val);
                        return val;
                    } catch (_) { return this.audioManager.masterGain; }
                };

                // Add MIDI mapping debugging
                window.getMidiMapping = () => {
                    if (this.audioManager) {
                        return this.audioManager.getMidiMapping();
                    }
                    return {};
                };

                // Add loading status check
                window.getAudioLoadingStatus = () => {
                    if (this.audioManager) {
                        return this.audioManager.getLoadingStatus();
                    }
                    return { loaded: 0, total: 0, percentage: 0 };
                };

                // Proactively unlock audio on first user interaction (autoplay policies)
                const unlock = () => {
                    try {
                        // Quiet click to unlock; ignore failures
                        this.audioManager.playSample('metronome_normal', 0.2, 0);
                    } catch (e) {
                        console.warn('Audio unlock attempt failed:', e);
                    } finally {
                        window.removeEventListener('click', unlock, true);
                        window.removeEventListener('touchstart', unlock, true);
                        window.removeEventListener('keydown', unlock, true);
                    }
                };
                window.addEventListener('click', unlock, true);
                window.addEventListener('touchstart', unlock, true);
                window.addEventListener('keydown', unlock, true);

                console.log('Audio enhancements added successfully');
            }
        }
    }

    // Initialize the simple audio system when DOM is ready
    function initializeSimpleAudio() {
        const grooveScribeAudio = new GrooveScribeSimpleAudio();
        
        // Wait for page to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => grooveScribeAudio.init(), 100);
            });
        } else {
            setTimeout(() => grooveScribeAudio.init(), 100);
        }

        // Make it globally accessible
        window.grooveScribeSimpleAudio = grooveScribeAudio;
    }

    // Start initialization
    initializeSimpleAudio();

})(); 
