# Fix for Issue #11: Multi-Measure Playback

## Problem
When playing back grooves with multiple measures, the notes were being interleaved instead of playing sequentially. For example, with a 2-measure groove:

**Expected behavior:**
- Measure 1, Note 1
- Measure 1, Note 2
- Measure 2, Note 1
- Measure 2, Note 2

**Actual behavior (buggy):**
- Measure 1, Note 1
- Measure 2, Note 1
- Measure 1, Note 2
- Measure 2, Note 2

## Root Cause
The issue was in the `create_MIDIURLFromGrooveData` function in `js/groove_utils.js` (lines 2988-3023).

The function processes drum arrays in two steps:
1. **Scale arrays** to full size (32 or 48 notes per measure)
2. **Slice arrays** per measure and pass to MIDI generation

However, there was an inconsistency in how different drum types were processed:

### Before the Fix

**Hi-Hat, Snare, Kick:**
```javascript
// Scale for ALL measures first
var FullNoteHHArray = root.scaleNoteArrayToFullSize(
    myGrooveData.hh_array, 
    myGrooveData.numberOfMeasures,  // <-- ALL measures
    ...
);

// Then slice per measure
for (var measureIndex = 0; measureIndex < myGrooveData.numberOfMeasures; measureIndex++) {
    var hhSlice = FullNoteHHArray.slice(measure_notes*measureIndex, measure_notes*(measureIndex+1));
}
```

**Toms (BUGGY):**
```javascript
for (var measureIndex = 0; measureIndex < myGrooveData.numberOfMeasures; measureIndex++) {
    // Slice from ORIGINAL array first
    var tomSlice = myGrooveData.toms_array[i].slice(orig_measure_notes*measureIndex, ...);
    
    // Then scale for ONLY 1 measure
    FullNoteTomsArray[i] = root.scaleNoteArrayToFullSize(
        tomSlice,
        1,  // <-- Only 1 measure!
        ...
    );
}
```

This caused toms to be processed differently, leading to the interleaving issue.

## Solution

The fix ensures that **all drum types** (HH, Snare, Kick, AND Toms) follow the same pattern:

1. **Scale for ALL measures first**
2. **Then slice per measure**

### After the Fix

```javascript
// Scale toms arrays for ALL measures (same as HH/Snare/Kick)
var FullNoteTomsArrays = [];
for(var i = 0; i < constant_NUMBER_OF_TOMS; i++) {
    FullNoteTomsArrays[i] = root.scaleNoteArrayToFullSize(
        myGrooveData.toms_array[i], 
        myGrooveData.numberOfMeasures,  // <-- ALL measures
        ...
    );
}

// Then slice per measure (same as HH/Snare/Kick)
for (var measureIndex = 0; measureIndex < myGrooveData.numberOfMeasures; measureIndex++) {
    var FullNoteTomsArray = [];
    for(var i = 0; i < constant_NUMBER_OF_TOMS; i++) {
        FullNoteTomsArray[i] = FullNoteTomsArrays[i].slice(
            measure_notes*measureIndex, 
            measure_notes*(measureIndex+1)
        );
    }
    
    // Pass to MIDI generation
    root.MIDI_from_HH_Snare_Kick_Arrays(midiTrack, ...);
}
```

## Changes Made

**File:** `js/groove_utils.js`
**Lines:** 2988-3023

1. Added a new loop before the measure loop to scale all toms arrays for ALL measures
2. Modified the inner loop to slice from the pre-scaled arrays instead of scaling slices

## Testing

### Unit Tests
- `tests/unit/multi-measure-playback.test.js` - Tests array slicing logic

### Integration Tests
- `tests/integration/multi-measure-midi.test.js` - Verifies the fix logic

All tests pass successfully.

## Verification

To verify the fix works:

1. Open GrooveScribe in a browser
2. Create a multi-measure groove (2+ measures)
3. Add notes in different measures
4. Play the groove
5. Verify that notes play sequentially by measure, not interleaved

## Impact

This fix affects:
- ✅ MIDI file generation for multi-measure grooves
- ✅ MIDI playback for multi-measure grooves
- ✅ Toms playback in multi-measure grooves
- ❌ Single-measure grooves (no change, already working)
- ❌ Visual display (no change, already working)
- ❌ Modern audio system (no change, already working correctly)

## Related Issues

- GitHub Issue #11: "Multi-measure playback plays notes interleaved"

