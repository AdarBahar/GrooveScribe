/*
/* eslint-disable prettier/prettier, no-empty, no-console, prefer-template */

 * GrooveScribe initialization bootstrap
 * - Ensures correct startup order after deferred script loads
 * - Avoids double init; retries if dependencies aren’t ready yet
 */
(function () {
  const MAX_RETRIES = 40; // ~2s with 50ms interval
  const RETRY_INTERVAL = 50;

  // Debug logging toggle: enable/disable console.log globally
  (function setupDebugLogging() {
    try {
      const qs = window.location.search || '';
      const getParam = (k) => {
        const m = qs.match(new RegExp('[?&]'+k+'=([^&]+)'));
        return m ? decodeURIComponent(m[1]) : null;
      };
      const fromQS = getParam('Debug');
      const fromLS = (function(){ try { return localStorage.getItem('gs_debug_logs'); } catch(_) { return null; } })();
      const initial = (fromQS != null ? (fromQS === '1' || fromQS === 'true') : (fromLS === '1')) || false;
      if (!window.__GS_ORIG_CONSOLE_LOG__) window.__GS_ORIG_CONSOLE_LOG__ = console.log.bind(console);
      window.GS_setDebugLogs = function(on){
        try {
          window.__GS_DEBUG__ = !!on;
          if (window.__GS_DEBUG__) {
            console.log = window.__GS_ORIG_CONSOLE_LOG__;
          } else {
            console.log = function(){ /* suppressed when debug off */ };
          }
          try { localStorage.setItem('gs_debug_logs', window.__GS_DEBUG__ ? '1' : '0'); } catch(_) {}
          // Update menu label if present
          const item = document.getElementById('debugLogsToggleMenuItem');
          if (item) item.textContent = 'Debug Logs: ' + (window.__GS_DEBUG__ ? 'On' : 'Off');
        } catch(_){}
      };
      // initialize
      window.GS_setDebugLogs(initial);
    } catch(_) {}
  })();

  function safeInit() {
    try {
      if (window.__GS_APP_READY__) return true;
      if (window.myGrooveWriter && window.grooves && typeof window.myGrooveWriter.runsOnPageLoad === 'function') {
        // Already initialized somewhere else
        window.__GS_APP_READY__ = true;
        return true;
      }

      // GrooveWriter is created in groove_writer.js; utils is required before it
      if (typeof window.GrooveWriter === 'function' && typeof window.GrooveUtils === 'function') {
        if (!window.myGrooveWriter) {
          window.myGrooveWriter = new window.GrooveWriter();
        }
        // Expose active utils/groove globally for transport shim
        try {
          const utils = window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils;
          if (utils) {
            window.__GS_ACTIVE_UTILS = utils;
            window.__GS_ACTIVE_GROOVE = utils.myGrooveData;
            try { console.log('[Init] __GS_ACTIVE_* set from init.js'); } catch(_) {}
          }
        } catch (_) {}
        // Inject conditional CSS based on flags
        try {
          const utils = window.myGrooveWriter && window.myGrooveWriter.myGrooveUtils;
          if (utils && utils.grooveDBAuthoring) {
            addStylesheet('css/grooveDB_authoring.css');
          }
          if (utils && utils.debugMode) {
            addStylesheet('css/groove_debug.css');
          }
        } catch (e) {
          console.warn('Conditional CSS injection failed:', e);
        }
        // groves global should be defined by grooves.js; if not, it will be after next tick
        if (typeof window.myGrooveWriter.runsOnPageLoad === 'function') {
          window.myGrooveWriter.runsOnPageLoad();
          window.__GS_APP_READY__ = true;
          return true;
        }
      }
    } catch (e) {
      console.warn('Init attempt failed:', e);
    }
    return false;
  }

  function addStylesheet(href) {
    if ([...document.querySelectorAll('link[rel="stylesheet"]')].some(l => l.getAttribute('href') === href)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    document.head.appendChild(link);
  }

  function initWithRetry() {
    let tries = 0;
    const tick = () => {
      if (safeInit()) return;
      if (++tries >= MAX_RETRIES) return;
      setTimeout(tick, RETRY_INTERVAL);
    };
    tick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWithRetry);
  } else {
    initWithRetry();
  }
})();
