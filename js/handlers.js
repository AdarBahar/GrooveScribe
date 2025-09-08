/*
/* eslint-disable prettier/prettier */

 * Event handlers migrated from inline onclick attributes
 * Keeps HTML clean and uses addEventListener with proper preventDefault
 */
(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  onReady(() => {
    const gw = () => window.myGrooveWriter;

    // Time signature popup
    document.getElementById('timeLabel')?.addEventListener('click', () => gw()?.timeSigPopupOpen());

    // Subdivision buttons
    const subdiv = (id, val) => document.getElementById(id)?.addEventListener('click', () => gw()?.changeDivision(val));
    subdiv('subdivision_8ths', 8);
    subdiv('subdivision_16ths', 16);
    subdiv('subdivision_32ths', 32);
    subdiv('subdivision_12ths', 12);
    subdiv('subdivision_24ths', 24);
    subdiv('subdivision_48ths', 48);

    // Undo/Redo
    document.getElementById('undoButton')?.addEventListener('click', () => gw()?.undoCommand());
    document.getElementById('redoButton')?.addEventListener('click', () => gw()?.redoCommand());

    // Metronome
    const metro = (id, v) => document.getElementById(id)?.addEventListener('click', () => gw()?.setMetronomeFrequency(v));
    metro('metronomeOff', 0);
    metro('metronome4ths', 4);
    metro('metronome8ths', 8);
    metro('metronome16ths', 16);

    // Top right anchors
    const bindEvt = (id, fnName) => document.getElementById(id)?.addEventListener('click', (e) => { e.preventDefault?.(); gw()?.[fnName]?.(e); });
    bindEvt('myGrooveAnchor', 'myGrooveAnchorClick');
    bindEvt('permutationAnchor', 'permutationAnchorClick');
    bindEvt('groovesAnchor', 'groovesAnchorClick');
    bindEvt('helpAnchor', 'helpAnchorClick');

    // Bottom row buttons
    document.getElementById('clearAllNotesButton')?.addEventListener('click', (e) => { e.preventDefault(); gw()?.clearAllNotes(); });
    document.getElementById('showHideTomsButton')?.addEventListener('click', (e) => { e.preventDefault(); gw()?.showHideToms(false, false); });
    document.getElementById('stickingsButton')?.addEventListener('click', () => gw()?.stickingsAnchorClick());
    document.getElementById('downloadButton')?.addEventListener('click', () => gw()?.DownloadAnchorClick());
    document.getElementById('printButton')?.addEventListener('click', () => gw()?.printMusic());
    document.getElementById('shareSaveButton')?.addEventListener('click', (e) => { e.preventDefault(); gw()?.show_FullURLPopup(); });
    document.getElementById('saveGrooveButton')?.addEventListener('click', (e) => { e.preventDefault(); gw()?.saveCurrentGroove(); });

    // Show/Hide ABC
    document.getElementById('showHideABC')?.addEventListener('click', (e) => { e.preventDefault(); gw()?.ShowHideABCResults(); });
  });
})();



(function () {
  'use strict';
  function onReady(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  onReady(() => {
    const gw = () => window.myGrooveWriter;
    // Metronome Options anchor
    document.getElementById('metronomeOptionsAnchor')?.addEventListener('click', (e) => gw()?.metronomeOptionsAnchorClick?.(e));

    // ABC refresh and actions
    document.getElementById('showLegend')?.addEventListener('change', () => gw()?.refresh_ABC?.());
    document.getElementById('reRenderABCButton')?.addEventListener('click', () => gw()?.displayNewSVG?.());
    document.getElementById('saveABCButton')?.addEventListener('click', () => gw()?.saveABCtoFile?.());

    // Metronome options context menu
    const bindClick = (id, val) => document.getElementById(id)?.addEventListener('click', () => gw()?.metronomeOptionsMenuPopupClick?.(val));
    bindClick('metronomeOptionsContextMenuSolo', 'Solo');
    bindClick('metronomeOptionsContextMenuSpeedUp', 'SpeedUp');
    bindClick('metronomeOptionsContextMenuCountIn', 'CountIn');
    bindClick('metronomeOptionsContextMenuOffTheOne', 'OffTheOne');
    bindClick('metronomeOptionsContextMenuVisualSync', 'VisualSync');

    // Offset click menus
    const bindOC = (id, val) => document.getElementById(id)?.addEventListener('click', () => gw()?.metronomeOptionsMenuOffsetClickPopupClick?.(val));
    bindOC('metronomeOptionsOffsetClickContextMenuOnThe1', '1');
    bindOC('metronomeOptionsOffsetClickContextMenuOnTheE', 'E');
    bindOC('metronomeOptionsOffsetClickContextMenuOnTheAND', 'AND');
    bindOC('metronomeOptionsOffsetClickContextMenuOnTheA', 'A');
    bindOC('metronomeOptionsOffsetClickContextMenuOnTheROTATE', 'ROTATE');
    bindOC('metronomeOptionsOffsetClickContextMenuOnThe1Triplet', '1');
    bindOC('metronomeOptionsOffsetClickContextMenuOnTheTI', 'TI');
    bindOC('metronomeOptionsOffsetClickContextMenuOnTheTA', 'TA');
    bindOC('metronomeOptionsOffsetClickContextMenuOnTheROTATE', 'ROTATE');

    // Time signature popup buttons
    document.getElementById('timeSigPopupCancel')?.addEventListener('click', () => gw()?.timeSigPopupClose?.('cancel'));
    document.getElementById('timeSigPopupOK')?.addEventListener('click', () => gw()?.timeSigPopupClose?.('ok'));

    // Full URL popup
    document.getElementById('fullURLPopupCloseButton')?.addEventListener('click', () => gw()?.close_FullURLPopup?.());
    document.getElementById('fullURLPopupCopyButton')?.addEventListener('click', () => gw()?.copyShareURLToClipboard?.());

    // Visual sync presets
    const vsInput = () => document.getElementById('visualSyncOffset');
    const setVs = (v) => { const i = vsInput(); if (i) { i.value = v; gw()?.applyVisualSyncOffset?.(); } };
    const bindVs = (id, v) => document.getElementById(id)?.addEventListener('click', () => setVs(v));
    bindVs('vsOffsetMinus100', -100);
    bindVs('vsOffsetMinus50', -50);
    bindVs('vsOffset0', 0);
    bindVs('vsOffset50', 50);
    bindVs('vsOffset100', 100);
    document.getElementById('visualSyncConfigurationCloseButton')?.addEventListener('click', () => gw()?.close_VisualSyncConfiguration?.());
  });

})();
