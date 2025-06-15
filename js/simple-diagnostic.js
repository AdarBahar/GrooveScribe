/**
 * Simple Diagnostic for GrooveScribe Audio System
 * This will help identify what's working and what's not
 */

(function() {
    'use strict';
    
    console.log('🔧 Simple Diagnostic Loading...');
    
    // Wait a moment for other scripts to load
    setTimeout(function() {
        console.log('=== GROOVESCRIBE AUDIO DIAGNOSTIC ===');
        console.log('Current URL:', window.location.href);
        console.log('Document ready state:', document.readyState);
        
        // Check what's available
        console.log('\n--- Available Objects ---');
        console.log('window.grooveScribeDebugAudio:', typeof window.grooveScribeDebugAudio);
        console.log('window.debugAudioManager:', typeof window.debugAudioManager);
        console.log('window.simpleAudioManager:', typeof window.simpleAudioManager);
        console.log('window.modernAudioManager:', typeof window.modernAudioManager);
        console.log('window.MIDI:', typeof window.MIDI);
        console.log('window.MIDI.WebAudio:', window.MIDI ? typeof window.MIDI.WebAudio : 'MIDI not available');
        
        // Check for GrooveScribe functions
        console.log('\n--- GrooveScribe Functions ---');
        console.log('play_single_note_for_note_setting:', typeof window.play_single_note_for_note_setting);
        console.log('myGrooveWriter:', typeof window.myGrooveWriter);
        
        // Test basic audio functionality
        console.log('\n--- Audio Element Test ---');
        try {
            const testAudio = new Audio();
            console.log('HTML5 Audio supported:', true);
            
            // Test loading a sample
            testAudio.src = 'soundfont/NewDrumSamples/MP3/Kick.mp3';
            testAudio.addEventListener('canplaythrough', () => {
                console.log('✅ Test audio file can load: Kick.mp3');
            });
            testAudio.addEventListener('error', (e) => {
                console.log('❌ Test audio file failed to load:', e.message || 'Unknown error');
            });
            testAudio.load();
            
        } catch (error) {
            console.log('❌ HTML5 Audio not supported:', error.message);
        }
        
        // Test fetch to audio files
        console.log('\n--- Network Test ---');
        fetch('soundfont/NewDrumSamples/MP3/Kick.mp3', { method: 'HEAD' })
            .then(response => {
                console.log('✅ Fetch test successful:', response.status, response.statusText);
            })
            .catch(error => {
                console.log('❌ Fetch test failed:', error.message);
            });
            
        // Look for any initialization errors
        console.log('\n--- Error Check ---');
        console.log('Check above this line for any red error messages');
        
        // Create basic test functions that should always work
        window.basicAudioTest = function() {
            console.log('=== BASIC AUDIO TEST ===');
            
            const audio = new Audio('soundfont/NewDrumSamples/MP3/Kick.mp3');
            audio.volume = 0.5;
            
            audio.addEventListener('canplaythrough', () => {
                console.log('✅ Audio loaded, attempting to play...');
                audio.play().then(() => {
                    console.log('✅ Audio played successfully!');
                }).catch(err => {
                    console.log('❌ Audio play failed:', err.message);
                });
            });
            
            audio.addEventListener('error', (e) => {
                console.log('❌ Audio load failed:', e.message || 'Unknown error');
            });
            
            console.log('Loading audio file...');
            audio.load();
        };
        
        window.checkFileAccess = function() {
            console.log('=== FILE ACCESS TEST ===');
            
            const testFiles = [
                'soundfont/NewDrumSamples/MP3/Kick.mp3',
                'soundfont/NewDrumSamples/MP3/Snare Normal.mp3',
                'soundfont/NewDrumSamples/MP3/16 Tom.mp3'
            ];
            
            testFiles.forEach(file => {
                fetch(file, { method: 'HEAD' })
                    .then(response => {
                        console.log(`✅ ${file}: ${response.status} ${response.statusText}`);
                    })
                    .catch(error => {
                        console.log(`❌ ${file}: ${error.message}`);
                    });
            });
        };
        
        window.listAllGlobalAudioStuff = function() {
            console.log('=== ALL AUDIO-RELATED GLOBALS ===');
            
            for (let key in window) {
                if (key.toLowerCase().includes('audio') || 
                    key.toLowerCase().includes('midi') || 
                    key.toLowerCase().includes('debug') ||
                    key.toLowerCase().includes('sound') ||
                    key.toLowerCase().includes('groove')) {
                    console.log(`${key}:`, typeof window[key]);
                }
            }
        };
        
        console.log('\n--- Available Diagnostic Functions ---');
        console.log('basicAudioTest()          - Test basic HTML5 audio');
        console.log('checkFileAccess()         - Test access to MP3 files');
        console.log('listAllGlobalAudioStuff() - List all audio-related globals');
        
        console.log('\n=== DIAGNOSTIC COMPLETE ===');
        
    }, 500); // Wait 500ms for other scripts
    
})(); 