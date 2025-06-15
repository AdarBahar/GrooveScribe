/**
 * Debug Audio System for GrooveScribe
 * Comprehensive logging and error handling to identify issues
 */

(function() {
    'use strict';

    console.log('🎵 Debug Audio System Loading...');

    // Enhanced AudioManager with extensive debugging
    class DebugAudioManager {
        constructor() {
            console.log('🔧 Creating DebugAudioManager...');
            this.isInitialized = false;
            this.audioElements = {};
            this.loadedSamples = 0;
            this.totalSamples = 0;
            this.loadErrors = [];
            this.initializationLog = [];
            
            // MIDI note to drum sample mapping (GrooveScribe specific)
            this.midiToSample = {
                35: 'kick',           // constant_OUR_MIDI_KICK_NORMAL
                38: 'snare_normal',   // constant_OUR_MIDI_SNARE_NORMAL  
                21: 'snare_ghost',    // constant_OUR_MIDI_SNARE_GHOST
                22: 'snare_accent',   // constant_OUR_MIDI_SNARE_ACCENT
                37: 'snare_xstick',   // constant_OUR_MIDI_SNARE_XSTICK
                25: 'snare_flam',     // constant_OUR_MIDI_SNARE_FLAM
                23: 'snare_drag',     // constant_OUR_MIDI_SNARE_DRAG
                24: 'snare_buzz',     // constant_OUR_MIDI_SNARE_BUZZ
                42: 'hihat_normal',   // constant_OUR_MIDI_HIHAT_NORMAL
                46: 'hihat_open',     // constant_OUR_MIDI_HIHAT_OPEN
                44: 'hihat_foot',     // constant_OUR_MIDI_HIHAT_FOOT
                26: 'hihat_accent',   // constant_OUR_MIDI_HIHAT_ACCENT
                51: 'ride',           // constant_OUR_MIDI_HIHAT_RIDE
                53: 'ride_bell',      // constant_OUR_MIDI_HIHAT_RIDE_BELL
                56: 'cowbell',        // constant_OUR_MIDI_HIHAT_COW_BELL
                49: 'crash',          // constant_OUR_MIDI_HIHAT_CRASH
                55: 'stacker',        // constant_OUR_MIDI_HIHAT_STACKER
                48: 'tom1',           // constant_OUR_MIDI_TOM1_NORMAL (High Tom)
                47: 'tom2',           // constant_OUR_MIDI_TOM2_NORMAL (Mid Tom)
                45: 'tom3',           // constant_OUR_MIDI_TOM3_NORMAL (Low Tom) 
                43: 'tom4',           // constant_OUR_MIDI_TOM4_NORMAL (Floor Tom)
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
                'tom1': '10 Tom.mp3',
                'tom2': '16 Tom.mp3',
                'tom3': 'Rack Tom.mp3',
                'tom4': 'Floor Tom.mp3',
                'metronome_normal': 'metronomeClick.mp3',
                'metronome_accent': 'metronome1Count.mp3'
            };

            this.log('Constructor completed');
        }

        log(message) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = `[${timestamp}] ${message}`;
            console.log(`🎵 ${logEntry}`);
            this.initializationLog.push(logEntry);
        }

        async initialize() {
            this.log('Starting initialization...');
            try {
                this.log('Current location: ' + window.location.href);
                this.log('Document ready state: ' + document.readyState);
                
                // Test base path access
                await this.testBasePath();
                
                // Load audio elements
                await this.loadAudioElements();
                
                this.isInitialized = true;
                this.log(`Initialization completed successfully! Loaded ${this.loadedSamples}/${this.totalSamples} samples`);
                
                if (this.loadErrors.length > 0) {
                    this.log(`Load errors encountered: ${JSON.stringify(this.loadErrors)}`);
                }
                
                return true;
            } catch (error) {
                this.log(`Initialization failed: ${error.message}`);
                console.error('🚨 Debug Audio Manager initialization failed:', error);
                return false;
            }
        }

        async testBasePath() {
            const basePath = 'soundfont/NewDrumSamples/MP3/';
            const testFile = 'Kick.mp3';
            const testUrl = basePath + testFile;
            
            this.log(`Testing base path access: ${testUrl}`);
            
            try {
                const response = await fetch(testUrl, { method: 'HEAD' });
                this.log(`Base path test response: ${response.status} ${response.statusText}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                this.log(`Base path test failed: ${error.message}`);
                throw new Error(`Cannot access audio files at ${testUrl}: ${error.message}`);
            }
        }

        async loadAudioElements() {
            const basePath = 'soundfont/NewDrumSamples/MP3/';
            this.totalSamples = Object.keys(this.sampleFiles).length;
            this.loadedSamples = 0;
            this.loadErrors = [];

            this.log(`Starting to load ${this.totalSamples} audio samples from: ${basePath}`);

            const loadPromises = Object.entries(this.sampleFiles).map(([sampleName, fileName]) => {
                return this.loadSingleAudio(sampleName, fileName, basePath);
            });

            const results = await Promise.allSettled(loadPromises);
            
            results.forEach((result, index) => {
                const [sampleName] = Object.entries(this.sampleFiles)[index];
                if (result.status === 'fulfilled' && result.value) {
                    this.loadedSamples++;
                } else {
                    const error = result.reason || 'Unknown error';
                    this.loadErrors.push({ sample: sampleName, error: error.toString() });
                }
            });

            this.log(`Audio loading complete: ${this.loadedSamples}/${this.totalSamples} samples loaded successfully`);
        }

        async loadSingleAudio(sampleName, fileName, basePath) {
            return new Promise((resolve, reject) => {
                const audio = new Audio();
                const url = basePath + fileName;
                
                this.log(`Loading ${sampleName}: ${url}`);
                
                const timeout = setTimeout(() => {
                    this.log(`Timeout loading ${sampleName}`);
                    reject(new Error('Load timeout'));
                }, 10000); // 10 second timeout
                
                audio.addEventListener('canplaythrough', () => {
                    clearTimeout(timeout);
                    this.audioElements[sampleName] = audio;
                    this.log(`✅ Successfully loaded: ${sampleName}`);
                    resolve(true);
                });
                
                audio.addEventListener('error', (e) => {
                    clearTimeout(timeout);
                    const errorMsg = `Failed to load ${sampleName}: ${e.message || 'Unknown error'}`;
                    this.log(`❌ ${errorMsg}`);
                    reject(new Error(errorMsg));
                });
                
                // Set audio properties
                audio.preload = 'auto';
                audio.volume = 1.0;
                
                // Start loading
                audio.src = url;
                audio.load();
            });
        }

        playMidiNote(channel, midiNote, velocity = 127, delay = 0) {
            this.log(`playMidiNote called: channel=${channel}, note=${midiNote}, velocity=${velocity}, delay=${delay}`);
            
            if (!this.isInitialized) {
                this.log('❌ Not initialized - cannot play note');
                return false;
            }

            const sampleName = this.midiToSample[midiNote];
            if (!sampleName) {
                this.log(`❌ No sample mapping for MIDI note: ${midiNote}`);
                return false;
            }

            this.log(`🎵 Playing sample: ${sampleName} for MIDI note ${midiNote}`);
            const normalizedVelocity = Math.max(0.1, Math.min(1.0, velocity / 127));
            return this.playSample(sampleName, normalizedVelocity, delay);
        }

        playSample(sampleName, velocity = 1.0, delay = 0) {
            const audio = this.audioElements[sampleName];
            if (!audio) {
                this.log(`❌ Audio sample not found: ${sampleName}`);
                return false;
            }

            try {
                const audioClone = audio.cloneNode();
                audioClone.volume = Math.max(0.1, Math.min(1.0, velocity));
                
                const playPromise = delay > 0 
                    ? new Promise(resolve => setTimeout(() => resolve(audioClone.play()), delay * 1000))
                    : audioClone.play();
                
                playPromise.then(() => {
                    this.log(`✅ Successfully played: ${sampleName}`);
                }).catch(e => {
                    this.log(`❌ Play failed for ${sampleName}: ${e.message}`);
                });
                
                return true;
            } catch (error) {
                this.log(`❌ Error playing sample ${sampleName}: ${error.message}`);
                return false;
            }
        }

        // Debug methods
        getAvailableSamples() {
            return Object.keys(this.audioElements);
        }

        getMidiMapping() {
            return this.midiToSample;
        }

        getLoadingStatus() {
            return {
                loaded: this.loadedSamples,
                total: this.totalSamples,
                percentage: Math.round((this.loadedSamples / this.totalSamples) * 100),
                errors: this.loadErrors,
                initialized: this.isInitialized
            };
        }

        getInitializationLog() {
            return this.initializationLog;
        }

        getDetailedStatus() {
            return {
                initialized: this.isInitialized,
                samplesLoaded: this.loadedSamples,
                totalSamples: this.totalSamples,
                loadErrors: this.loadErrors,
                availableSamples: this.getAvailableSamples(),
                midiMapping: this.getMidiMapping(),
                initLog: this.initializationLog
            };
        }
    }

    // Integration wrapper
    class GrooveScribeDebugAudio {
        constructor() {
            console.log('🎵 Creating GrooveScribeDebugAudio...');
            this.audioManager = null;
            this.initialized = false;
        }

        async init() {
            try {
                console.log('🎵 Initializing debug audio system...');
                this.audioManager = new DebugAudioManager();
                const success = await this.audioManager.initialize();
                
                if (success) {
                    this.createMidiJsBridge();
                    this.replaceBrokenAudioFunctions();
                    this.addDebugEnhancements();
                    this.initialized = true;
                    console.log('🎉 Debug audio system initialized successfully!');
                } else {
                    console.warn('🚨 Debug audio system initialization failed');
                }
                
            } catch (error) {
                console.error('🚨 Failed to initialize debug audio system:', error);
            }
        }

        createMidiJsBridge() {
            if (!window.MIDI) {
                window.MIDI = {};
            }

            const self = this;

            window.MIDI.WebAudio = {
                noteOn: (channel, note, velocity, delay) => {
                    console.log(`🎵 MIDI.WebAudio.noteOn called: ${channel}, ${note}, ${velocity}, ${delay}`);
                    if (self.audioManager) {
                        return self.audioManager.playMidiNote(channel, note, velocity, delay);
                    }
                    console.log('❌ No audio manager available');
                    return false;
                },
                noteOff: () => true,
                stopAllNotes: () => true
            };

            window.MIDI.AudioTag = {
                noteOn: (channel, note, velocity, delay) => {
                    console.log(`🎵 MIDI.AudioTag.noteOn called: ${channel}, ${note}, ${velocity}, ${delay}`);
                    if (self.audioManager) {
                        return self.audioManager.playMidiNote(channel, note, velocity, delay);
                    }
                    return false;
                },
                noteOff: () => true
            };

            console.log('🔗 MIDI.js bridge created successfully (Debug)');
        }

        replaceBrokenAudioFunctions() {
            const self = this;
            
            const originalFunction = window.play_single_note_for_note_setting;
            
            window.play_single_note_for_note_setting = (note_val) => {
                console.log(`🎵 play_single_note_for_note_setting called with note: ${note_val}`);
                
                if (self.audioManager && self.audioManager.isInitialized) {
                    return self.audioManager.playMidiNote(9, note_val, 127, 0);
                } else {
                    console.warn('🚨 Debug Audio Manager not available, trying fallback...');
                    if (originalFunction && typeof originalFunction === 'function') {
                        console.log('🔄 Using original function as fallback');
                        return originalFunction(note_val);
                    }
                    return false;
                }
            };

            console.log('🔧 Audio functions replaced with debug implementation');
        }

        addDebugEnhancements() {
            if (this.audioManager) {
                // Expose everything globally for debugging
                window.debugAudioManager = this.audioManager;
                window.modernAudioManager = this.audioManager; // For test compatibility
                window.simpleAudioManager = this.audioManager; // For test compatibility
                
                // Enhanced debug functions
                window.testDrumSound = (midiNote) => {
                    console.log(`🧪 Testing drum sound for MIDI note: ${midiNote}`);
                    if (this.audioManager) {
                        const result = this.audioManager.playMidiNote(9, midiNote, 127, 0);
                        console.log(`Test result: ${result ? 'SUCCESS' : 'FAILED'}`);
                        return result;
                    }
                    return false;
                };

                window.getAvailableAudioSamples = () => {
                    return this.audioManager ? this.audioManager.getAvailableSamples() : [];
                };

                window.getMidiMapping = () => {
                    return this.audioManager ? this.audioManager.getMidiMapping() : {};
                };

                window.getAudioLoadingStatus = () => {
                    return this.audioManager ? this.audioManager.getLoadingStatus() : {};
                };

                window.getDetailedAudioStatus = () => {
                    return this.audioManager ? this.audioManager.getDetailedStatus() : {};
                };

                window.getAudioInitLog = () => {
                    return this.audioManager ? this.audioManager.getInitializationLog() : [];
                };

                console.log('🛠️ Debug enhancements added successfully');
            }
        }
    }

    // Initialize when ready
    function initializeDebugAudio() {
        console.log('🎵 Setting up debug audio initialization...');
        const grooveScribeAudio = new GrooveScribeDebugAudio();
        
        const init = () => {
            console.log('🎵 Starting debug audio initialization...');
            grooveScribeAudio.init();
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(init, 200);
            });
        } else {
            setTimeout(init, 200);
        }

        window.grooveScribeDebugAudio = grooveScribeAudio;
    }

    // Start initialization
    initializeDebugAudio();

})(); 