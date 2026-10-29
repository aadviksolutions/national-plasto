/**
 * National Plasto — Real-Time Multi-User & Cross-System Synchronization Engine
 * Ensures instantaneous, seamless live updates across multiple users, admins,
 * devices, and tabs without requiring page refresh.
 *
 * Transports:
 * 1. Server-Sent Events (SSE) Stream (/api/updates/stream) - 0ms network push
 * 2. Adaptive Heartbeat Version Polling (/api/updates/version) - fallback resilience
 * 3. Cross-Tab BroadcastChannel ('np_realtime_channel') - 0ms same-origin tab sync
 * 4. LocalStorage StorageEvent listener - legacy multi-window sync
 * 5. Page Visibility & Network Reconnection Hooks - instant catch-up on tab focus
 */
(function (global) {
  'use strict';

  if (global.NP_REALTIME) {
    return; // Already initialized
  }

  var listeners = {};
  var lastKnownVersion = 0;
  var lastCmsTimestamp = 0;
  var lastProductsTimestamp = 0;
  var eventSource = null;
  var pollTimer = null;
  var isConnected = false;
  var connectionMode = 'offline';
  var channel = null;

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('np_realtime_channel');
      channel.onmessage = function (ev) {
        if (ev.data && ev.data.type) {
          handleIncomingEvent(ev.data.type, ev.data.payload || {}, 'broadcast_channel');
        }
      };
    }
  } catch (_) {}

  // Cross-tab storage listener
  window.addEventListener('storage', function (e) {
    if (e.key === 'np_realtime_trigger' && e.newValue) {
      try {
        var parsed = JSON.parse(e.newValue);
        if (parsed && parsed.type) {
          handleIncomingEvent(parsed.type, parsed.payload || {}, 'storage_event');
        }
      } catch (_) {}
    }
  });

  // Re-check instantly when tab regains focus or network comes online
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      checkVersion(true);
    }
  });
  window.addEventListener('online', function () {
    checkVersion(true);
    initSSE();
  });

  function on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
    return function () {
      off(event, callback);
    };
  }

  function off(event, callback) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(function (cb) {
      return cb !== callback;
    });
  }

  function emit(event, payload, source) {
    var list = (listeners[event] || []).concat(listeners['*'] || []);
    list.forEach(function (cb) {
      try {
        cb(payload, { event: event, source: source, timestamp: Date.now() });
      } catch (err) {
        console.warn('[Realtime Sync] Listener error on "' + event + '":', err);
      }
    });
  }

  function broadcast(event, payload) {
    // 1. Emit locally
    emit(event, payload, 'local');

    // 2. Broadcast to other tabs on same machine
    if (channel) {
      try {
        channel.postMessage({ type: event, payload: payload, timestamp: Date.now() });
      } catch (_) {}
    }

    // 3. Trigger localStorage for tabs without BroadcastChannel
    try {
      localStorage.setItem('np_realtime_trigger', JSON.stringify({
        type: event,
        payload: payload,
        t: Date.now()
      }));
    } catch (_) {}
  }

  function handleIncomingEvent(type, payload, source) {
    emit(type, payload, source);

    // If customer-facing page, display subtle non-intrusive live badge if appropriate
    if (type === 'cms_updated' || type === 'products_updated') {
      showLiveUpdateToast(type);
    }
  }

  // --- 1. Server-Sent Events (SSE) Stream ---
  function initSSE() {
    if (typeof EventSource === 'undefined') {
      startPolling(3500);
      return;
    }

    if (eventSource) {
      try { eventSource.close(); } catch (_) {}
      eventSource = null;
    }

    try {
      eventSource = new EventSource('/api/updates/stream');

      eventSource.onopen = function () {
        isConnected = true;
        connectionMode = 'sse';
        emit('connection_state', { status: 'connected', mode: 'sse' }, 'system');
        // Slow down polling when SSE is healthy
        startPolling(20000);
      };

      eventSource.onmessage = function (e) {
        try {
          var data = JSON.parse(e.data);
          if (!data) return;

          if (data.type === 'connected') {
            lastKnownVersion = data.version || Date.now();
            lastCmsTimestamp = data.cmsTimestamp || 0;
            lastProductsTimestamp = data.productsTimestamp || 0;
            return;
          }

          // Process real-time update
          lastKnownVersion = data.version || Date.now();
          if (data.cmsTimestamp) lastCmsTimestamp = data.cmsTimestamp;
          if (data.productsTimestamp) lastProductsTimestamp = data.productsTimestamp;

          handleIncomingEvent(data.type, data.payload || {}, 'sse');
        } catch (err) {
          console.warn('[Realtime Sync] Error parsing SSE payload:', err);
        }
      };

      eventSource.onerror = function () {
        isConnected = false;
        connectionMode = 'polling_fallback';
        emit('connection_state', { status: 'reconnecting', mode: 'polling' }, 'system');
        try { eventSource.close(); } catch (_) {}
        eventSource = null;
        // Immediate fallback polling on SSE drop
        startPolling(3500);
      };
    } catch (e) {
      startPolling(3500);
    }
  }

  // --- 2. Adaptive Version Polling ---
  function checkVersion(force) {
    var url = '/api/updates/version?t=' + Date.now();
    fetch(url, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Status ' + res.status);
        return res.json();
      })
      .then(function (res) {
        if (!res || !res.success) return;

        var newVer = res.version || 0;
        var newCms = res.cmsTimestamp || 0;
        var newProds = res.productsTimestamp || 0;

        if (lastKnownVersion === 0) {
          lastKnownVersion = newVer;
          lastCmsTimestamp = newCms;
          lastProductsTimestamp = newProds;
          return;
        }

        if (newVer > lastKnownVersion || force) {
          var cmsChanged = newCms > lastCmsTimestamp;
          var prodsChanged = newProds > lastProductsTimestamp;

          lastKnownVersion = newVer;
          lastCmsTimestamp = newCms;
          lastProductsTimestamp = newProds;

          if (cmsChanged || (!prodsChanged && force)) {
            handleIncomingEvent('cms_updated', { source: 'version_poll', page: 'all' }, 'poll');
          }
          if (prodsChanged) {
            handleIncomingEvent('products_updated', { source: 'version_poll' }, 'poll');
          }
        }
      })
      .catch(function () {});
  }

  function startPolling(intervalMs) {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(function () {
      checkVersion(false);
    }, intervalMs || 4000);
  }

  // --- 3. Subtle Live Toast UI (Frontend) ---
  function showLiveUpdateToast(type) {
    // Only show on frontend pages, never on login or if suppressed
    if (document.getElementById('authScreen') && document.getElementById('authScreen').style.display !== 'none') {
      return;
    }
    // Check if on admin panel (admin has its own toast system)
    if (document.getElementById('appLayout')) {
      return;
    }

    var existing = document.getElementById('np_realtime_badge');
    if (existing) existing.remove();

    var badge = document.createElement('div');
    badge.id = 'np_realtime_badge';
    var text = type === 'products_updated' ? 'Product catalogue updated live' : 'Page content updated live';
    badge.innerHTML = '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e; margin-right:8px; box-shadow:0 0 10px #22c55e;"></span>' + text;

    badge.style.cssText = [
      'position: fixed',
      'bottom: 24px',
      'right: 24px',
      'background: rgba(15, 23, 42, 0.94)',
      'color: #ffffff',
      'padding: 10px 18px',
      'border-radius: 9999px',
      'font-size: 13px',
      'font-weight: 600',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      'z-index: 99999',
      'display: flex',
      'align-items: center',
      'opacity: 0',
      'transform: translateY(12px)',
      'transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      'pointer-events: none',
      'border: 1px solid rgba(255, 255, 255, 0.15)'
    ].join(';');

    document.body.appendChild(badge);

    // Animate in
    setTimeout(function () {
      badge.style.opacity = '1';
      badge.style.transform = 'translateY(0)';
    }, 20);

    // Animate out
    setTimeout(function () {
      badge.style.opacity = '0';
      badge.style.transform = 'translateY(12px)';
      setTimeout(function () {
        if (badge.parentNode) badge.parentNode.removeChild(badge);
      }, 350);
    }, 3200);
  }

  // --- Initialize on Startup ---
  initSSE();
  startPolling(4000);

  // Expose API
  global.NP_REALTIME = {
    on: on,
    off: off,
    emit: emit,
    broadcast: broadcast,
    checkVersionNow: function () { checkVersion(true); },
    getStatus: function () {
      return {
        connected: isConnected,
        mode: connectionMode,
        lastKnownVersion: lastKnownVersion,
        lastCmsTimestamp: lastCmsTimestamp,
        lastProductsTimestamp: lastProductsTimestamp
      };
    }
  };

})(typeof window !== 'undefined' ? window : this);
