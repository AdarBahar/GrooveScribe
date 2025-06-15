# 🥁 GrooveScribe Drum Sound Testing

This directory contains test scripts to verify that all drum sounds in GrooveScribe are working correctly.

## Quick Test (Recommended)

### Browser Console Method
1. Open GrooveScribe in your browser
2. Open the browser console (F12 → Console tab)
3. Copy and paste the entire contents of `quick_drum_test.js`
4. Press Enter to run the test

### Expected Output
```
🥁 Quick Drum Sound Test
========================
✅ Kick (35): Working
✅ Snare Normal (38): Working
✅ Snare Ghost (21): Working
✅ Snare Accent (22): Working
✅ Cross Stick (37): Working
✅ Hi-hat (42): Working
✅ Hi-hat Open (46): Working
✅ Hi-hat Foot (44): Working
✅ Tom 1 (48): Working
✅ Tom 2 (47): Working
✅ Tom 3 (45): Working
✅ Tom 4 (43): Working
✅ Crash (49): Working
✅ Ride (51): Working
✅ Ride Bell (53): Working
✅ Metronome (77): Working
========================
📊 Results: 16/16 working (100%)
✅ All drum sounds working!

🔍 Testing Previously Problematic Toms:
✅ Tom 2: Fixed!
✅ Tom 3: Fixed!
```

## Comprehensive Test Suite

### Using the Full Test Suite
1. Open GrooveScribe in your browser
2. Open the browser console (F12 → Console tab)
3. Copy and paste the entire contents of `test_drum_sounds.js`
4. Run individual tests:
   ```javascript
   DrumSoundTest.runAllTests()              // Run all tests
   DrumSoundTest.runMIDITests()             // Test MIDI notes only
   DrumSoundTest.quickTestNote(47, "Tom 2") // Test specific note
   DrumSoundTest.playNote(47, "Tom 2")      // Play specific note
   ```

### Available Functions
- `DrumSoundTest.runAllTests()` - Complete test suite
- `DrumSoundTest.runSystemCheck()` - Check MIDI system
- `DrumSoundTest.runMIDITests()` - Test all drum sounds
- `DrumSoundTest.runGrooveScribeFunctionTests()` - Test GrooveScribe functions
- `DrumSoundTest.testProblematicToms()` - Test Tom 2 and Tom 3 specifically
- `DrumSoundTest.quickTestNote(midiNote, name)` - Test single note
- `DrumSoundTest.playNote(midiNote, name)` - Play single note

## Manual Testing

### Individual Note Testing
Test specific MIDI notes directly in the console:

```javascript
// Test Tom 2 (previously broken)
MIDI.WebAudio.noteOn(9, 47, 100, 0);

// Test Tom 3 (previously broken)  
MIDI.WebAudio.noteOn(9, 45, 100, 0);

// Test other drums
MIDI.WebAudio.noteOn(9, 35, 100, 0); // Kick (corrected)
MIDI.WebAudio.noteOn(9, 38, 100, 0); // Snare
MIDI.WebAudio.noteOn(9, 42, 100, 0); // Hi-hat
```

**Expected Result:** Each call should return an `AudioBufferSourceNode` object and play a sound.

### GrooveScribe Function Testing
Test the actual GrooveScribe drum functions:

```javascript
// Test tom functions (these should work without errors)
set_tom2_state('test', 'normal', true);  // Should play Tom 2 sound
set_tom1_state('test', 'normal', true);  // Should play Tom 1 sound
set_tom_state('test', 3, 'normal', true); // Should play Tom 3 sound
```

## MIDI Note Reference

| Drum Sound | MIDI Note | Constant |
|------------|-----------|----------|
| **Kick Normal** | **35** | **constant_OUR_MIDI_KICK_NORMAL** |
| Snare Normal | 38 | constant_OUR_MIDI_SNARE_NORMAL |
| **Snare Ghost** | **21** | **constant_OUR_MIDI_SNARE_GHOST** |
| **Snare Accent** | **22** | **constant_OUR_MIDI_SNARE_ACCENT** |
| **Cross Stick** | **37** | **constant_OUR_MIDI_SNARE_XSTICK** |
| Hi-hat Normal | 42 | constant_OUR_MIDI_HIHAT_NORMAL |
| Hi-hat Open | 46 | constant_OUR_MIDI_HIHAT_OPEN |
| Hi-hat Foot | 44 | constant_OUR_MIDI_HIHAT_FOOT |
| Tom 1 (High Tom) | 48 | constant_OUR_MIDI_TOM1_NORMAL |
| **Tom 2 (Mid Tom)** | **47** | **constant_OUR_MIDI_TOM2_NORMAL** |
| **Tom 3 (Low Tom)** | **45** | **constant_OUR_MIDI_TOM3_NORMAL** |
| Tom 4 (Floor Tom) | 43 | constant_OUR_MIDI_TOM4_NORMAL |
| Crash | 49 | constant_OUR_MIDI_CRASH |
| Ride | 51 | constant_OUR_MIDI_RIDE |
| Ride Bell | 53 | constant_OUR_MIDI_RIDE_BELL |
| Metronome Normal | 76 | constant_OUR_MIDI_METRONOME_NORMAL |
| Metronome Accent | 77 | constant_OUR_MIDI_METRONOME_ACCENT |

## Troubleshooting

### Common Issues

1. **"MIDI is not defined"**
   - Make sure you're running the test on the GrooveScribe page
   - Wait for the page to fully load before running tests

2. **"undefined" return values**
   - This indicates missing or empty soundfont data
   - Check the soundfont file for empty entries

3. **No sound but returns AudioBufferSourceNode**
   - Check browser audio settings
   - Make sure volume is turned up
   - Check if browser tab is muted

### Debugging Steps

1. **Check System Requirements:**
   ```javascript
   console.log('MIDI available:', typeof MIDI !== 'undefined');
   console.log('WebAudio available:', typeof MIDI.WebAudio !== 'undefined');
   console.log('noteOn function:', typeof MIDI.WebAudio.noteOn === 'function');
   ```

2. **Check Constants:**
   ```javascript
   console.log('Tom constants:', {
       tom1: constant_OUR_MIDI_TOM1_NORMAL,
       tom2: constant_OUR_MIDI_TOM2_NORMAL, 
       tom3: constant_OUR_MIDI_TOM3_NORMAL,
       tom4: constant_OUR_MIDI_TOM4_NORMAL
   });
   ```

3. **Check Soundfont:**
   ```javascript
   console.log('Soundfont location:', getMidiSoundFontLocation());
   ```

## Recent Fixes

**Issue:** Tom 2 (MIDI 47) and Tom 3 (MIDI 45) were not playing sounds.

**Root Cause:** Empty soundfont entries for:
- MIDI note 47 (Tom 2/Mid Tom) in `soundfont/gunshot-ogg.js`  
- MIDI note 45 (Tom 3/Low Tom) in `soundfont/gunshot-mp3.js`

**Solution:** Replaced empty soundfont entries with working audio data from functioning toms.

**Status:** ✅ FIXED - Both Tom 2 and Tom 3 should now work correctly.

## Files

- `quick_drum_test.js` - Simple console test script
- `test_drum_sounds.js` - Comprehensive test suite  
- `DRUM_SOUND_TESTING.md` - This documentation

## Usage Examples

### Quick Health Check
```javascript
// Paste quick_drum_test.js content and run
// Should show 100% success rate if all drums work
```

### Comprehensive Testing
```javascript
// Load the full test suite
// Then run:
const results = DrumSoundTest.runAllTests();
console.log('Success:', results.success);
console.log('Summary:', results.summary);
```

### Test Specific Issues
```javascript
// Test just the toms that were problematic
DrumSoundTest.testProblematicToms();

// Test and play Tom 2
DrumSoundTest.playNote(47, "Tom 2");
``` 