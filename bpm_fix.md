# GrooveScribe BPM and Playback Stabilization

This document summarizes the code changes that stabilized BPM timing, removed audio glitches, and made playback resilient across tab focus changes.

Note: References use function/section names instead of line numbers to avoid drift. File links point to the master branch.

## Transport and Scheduler
- Web Audio transport replaces the HTML5 audio bridge; adds master gain + compressor for a cleaner mix.
  - File: js/modern-audio-system.js (AudioManager.initializeAudioContext)
    - https://github.com/AdarBahar/GrooveScribe/blob/master/js/modern-audio-system.js
- Look‑ahead scheduler (AudioContext time) keeps playback stable, including on inactive tabs.
  - File: js/modern-audio-system.js (MIDI.Player._startAudioScheduler; uses `_schedAheadSec`, `_schedIntervalMs`)
- Loop continuity: scheduler advances by exact bar duration; runtime emits both end (now==end) and wrap (now==0) timing events.
  - File: js/modern-audio-system.js (MIDI.Player._startAudioScheduler and MIDI.Player.start tick loop)
- Immediate stop: tracks scheduled sources and cancels them with a short fade for responsive Stop.
  - File: js/modern-audio-system.js (AudioManager.stopAllScheduled; MIDI.Player.stop calls it)
- Bar‑end BPM changes: `setBPM` defers updates and applies exactly at the next bar boundary (no mid‑bar reschedule, no extra hit).
  - File: js/modern-audio-system.js (MIDI.Player.setBPM -> _pendingSetBPM applied inside _startAudioScheduler on wrap)

## Auto Speed Up (Play+)
- Wall‑clock scheduling: first increase is based on playback start time, then every interval at bar boundaries.
  - File: js/groove_writer.js (root.metronomeAutoSpeedUpTempoUpdate; class_auto_* variables)
- No restart: tempo increases apply via deferred `setBPM` at wrap (no jump cuts).
  - Files: js/groove_writer.js (metronomeAutoSpeedUpTempoUpdate), js/modern-audio-system.js (MIDI.Player.setBPM deferral)
- Snackbar on increase: “X minutes past, increasing BPM by Y. Next at HH:MM:SS”.
  - File: js/groove_writer.js (root.showSnack; called from metronomeAutoSpeedUpTempoUpdate)
- Indicator: bottom‑right “+Y BPM every Xm — Next in mm:ss → Z BPM” updates every 0.5s; hides on Stop/disable.
  - Files: index.html (#gs-auto-indicator), js/groove_writer.js (root.updateAutoIndicator; enableAutoSpeedUp/disableAutoSpeedUp)

## Visual Timing and UI
- Decoupled timing: audio percent uses raw now/end; visual percent uses an adjustable offset for highlighting only.
  - Files: js/groove_utils.js (ourMIDICallback computes audioPercentComplete and visualPercentComplete using constant_VISUAL_SYNC_OFFSET_MS)
- Visuals always update: when the Web Audio scheduler is active, transport audio is skipped in percentProgress, while mapping/index progression remains.
  - File: js/groove_utils.js (percentProgress and _playIndex; checks window.__GS_AUDIO_SCHED_ACTIVE)
- Wrap prime: triggers the first visual index on wrap to remove perceived gap at bar start.
  - File: js/groove_utils.js (percentProgress wrap-handling and prime-first-index logic)

## Initialization and Redundancy Guards
- Single init pass via __GS_APP_READY__ to avoid double runsOnPageLoad().
  - File: js/init.js (safeInit flow sets __GS_APP_READY__)
- One‑time MIDI listener: guarded by __GS_MIDI_LISTENER_ADDED__.
  - File: js/groove_utils.js (midiLoaderCallback)
- Shim‑aware loading: with the Web Audio shim, loadMIDIFromURL loads once; subsequent calls are ignored.
  - File: js/groove_utils.js (loadMIDIFromURL; checks MIDI.Player.isSimpleAudioShim and __GS_INITIAL_LOAD_DONE__)
- Active data exposure is set once per run for the scheduler to read current state.
  - Files: js/groove_utils.js (sets window.__GS_ACTIVE_UTILS/__GS_ACTIVE_GROOVE), js/init.js (initial exposure)

## Other UX Fixes
- Modal Done handlers wired for Auto Speed Up and Visual Sync popups.
  - Files: js/groove_writer.js (show_/close_ MetronomeAutoSpeedupConfiguration; show_/close_ VisualSyncConfiguration), index.html (popup markup and Done buttons)
- Debug toggle in Help menu to enable/disable console.log without muting warnings/errors.
  - Files: js/init.js (GS_setDebugLogs), index.html (Help menu item), js/groove_writer.js (Help menu handler)

## Tuning and Defaults
- Scheduler look‑ahead set to 0.10s for responsive Stop and fewer queued hits.
  - File: js/modern-audio-system.js (MIDI.Player._schedAheadSec)
- Source registry + short fade (~30ms) on Stop to suppress trailing notes.
  - File: js/modern-audio-system.js (AudioManager.stopAllScheduled)

## Expected Outcomes
- Tempo increases occur at precise, bar‑aligned intervals; no delayed first bump.
- No audible extra hit after BPM changes; playback remains phase‑consistent.
- Visual progress shows reliably every loop and stays in sync with audio.
- Stop is immediate; Auto Speed Up timers and indicators stop as well.
