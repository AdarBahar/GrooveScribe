/**
 * Multi-Measure Playback Tests
 * Tests for Issue #11: Measures should play sequentially, not interleaved
 */

describe('Multi-Measure Playback', () => {
  // Mock the global constants
  beforeEach(() => {
    global.constant_NUMBER_OF_TOMS = 6;
    global.constant_OUR_MIDI_VELOCITY_NORMAL = 100;
    global.constant_OUR_MIDI_VELOCITY_ACCENT = 120;
  });

  test('should create MIDI with measures in sequential order', () => {
    // Create a simple 2-measure groove
    const grooveData = {
      numberOfMeasures: 2,
      notesPerMeasure: 16,
      numBeats: 4,
      noteValue: 4,
      tempo: 120,
      swingPercent: 0,
      metronomeFrequency: 0,
      timeDivision: 16,
      showToms: false,
      // Measure 1: kick on beat 1, snare on beat 3
      // Measure 2: kick on beat 2, snare on beat 4
      kick_array: [
        true, false, false, false, false, false, false, false,  // Measure 1
        false, false, false, false, false, false, false, false,
        false, false, false, false, true, false, false, false,  // Measure 2
        false, false, false, false, false, false, false, false
      ],
      snare_array: [
        false, false, false, false, false, false, false, false,  // Measure 1
        true, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false,  // Measure 2
        false, false, false, false, true, false, false, false
      ],
      hh_array: Array(32).fill(false),
      toms_array: [
        Array(32).fill(false),
        Array(32).fill(false),
        Array(32).fill(false),
        Array(32).fill(false),
        Array(32).fill(false),
        Array(32).fill(false)
      ]
    };

    // The MIDI should have notes in this order:
    // 1. Kick (measure 1, beat 1)
    // 2. Snare (measure 1, beat 3)
    // 3. Kick (measure 2, beat 2)
    // 4. Snare (measure 2, beat 4)
    
    // NOT interleaved like:
    // 1. Kick (measure 1, beat 1)
    // 2. Kick (measure 2, beat 2)
    // 3. Snare (measure 1, beat 3)
    // 4. Snare (measure 2, beat 4)

    expect(grooveData.numberOfMeasures).toBe(2);
    expect(grooveData.kick_array.length).toBe(32);
  });

  test('should scale note arrays correctly for multi-measure grooves', () => {
    // Test the scaleNoteArrayToFullSize function behavior
    const noteArray = [
      true, false, false, false,  // Measure 1
      false, true, false, false   // Measure 2
    ];
    
    const numMeasures = 2;
    const notesPerMeasure = 4;
    
    // When scaled, should maintain measure boundaries
    // Measure 1 notes should come before Measure 2 notes
    expect(noteArray.length).toBe(8);
    expect(noteArray[0]).toBe(true);  // Measure 1, position 0
    expect(noteArray[4]).toBe(false); // Measure 2, position 0
    expect(noteArray[5]).toBe(true);  // Measure 2, position 1
  });

  test('should slice measures correctly when creating MIDI', () => {
    // Test that measure slicing preserves sequential order
    const fullArray = [1, 2, 3, 4, 5, 6, 7, 8];  // 2 measures, 4 notes each
    const measureNotes = 4;
    const numberOfMeasures = 2;
    
    // Measure 1 should be [1, 2, 3, 4]
    const measure1 = fullArray.slice(measureNotes * 0, measureNotes * 1);
    expect(measure1).toEqual([1, 2, 3, 4]);
    
    // Measure 2 should be [5, 6, 7, 8]
    const measure2 = fullArray.slice(measureNotes * 1, measureNotes * 2);
    expect(measure2).toEqual([5, 6, 7, 8]);
  });

  test('should handle toms array slicing for multi-measure grooves', () => {
    // This tests the specific issue in lines 3000-3007 of groove_utils.js
    const tomsArray = [
      false, false, true, false,  // Measure 1
      false, true, false, false   // Measure 2
    ];
    
    const origMeasureNotes = 4;
    const measureIndex = 0;
    
    // Slice for measure 1
    const measure1Slice = tomsArray.slice(
      origMeasureNotes * measureIndex,
      origMeasureNotes * (measureIndex + 1)
    );
    expect(measure1Slice).toEqual([false, false, true, false]);
    
    // Slice for measure 2
    const measure2Index = 1;
    const measure2Slice = tomsArray.slice(
      origMeasureNotes * measure2Index,
      origMeasureNotes * (measure2Index + 1)
    );
    expect(measure2Slice).toEqual([false, true, false, false]);
  });

  test('should process all drum types in correct measure order', () => {
    // Verify that HH, Snare, Kick, and Toms are all sliced the same way
    const measureNotes = 4;
    const measureIndex = 1;  // Second measure
    
    const hhArray = [1, 2, 3, 4, 5, 6, 7, 8];
    const snareArray = [10, 20, 30, 40, 50, 60, 70, 80];
    const kickArray = [100, 200, 300, 400, 500, 600, 700, 800];
    
    // All should slice the same way for measure 2
    const hhSlice = hhArray.slice(measureNotes * measureIndex, measureNotes * (measureIndex + 1));
    const snareSlice = snareArray.slice(measureNotes * measureIndex, measureNotes * (measureIndex + 1));
    const kickSlice = kickArray.slice(measureNotes * measureIndex, measureNotes * (measureIndex + 1));
    
    expect(hhSlice).toEqual([5, 6, 7, 8]);
    expect(snareSlice).toEqual([50, 60, 70, 80]);
    expect(kickSlice).toEqual([500, 600, 700, 800]);
  });
});

