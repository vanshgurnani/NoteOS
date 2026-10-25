(() => {
  if (window.__noteOsMeetCaptureInstalled) return;
  window.__noteOsMeetCaptureInstalled = true;
  let socket = null;
  let active = false;
  let seen = new Set();
  let observer = null;
  const normalize = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  function emit(root) {
    if (!active || !socket || socket.readyState !== WebSocket.OPEN) return;
    const nodes = root.querySelectorAll('[aria-live], [data-participant-id], [jsname="tgaKEf"], [jsname="YSxPC"], [data-message-text]');
    for (const node of nodes) {
      const text = normalize(node.innerText || node.textContent);
      if (!text || text.length < 2 || text.length > 1500) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (seen.size > 1500) seen = new Set(Array.from(seen).slice(-700));
      const speakerNode = node.querySelector('[data-participant-id], [aria-label]');
      const speaker = normalize(speakerNode?.getAttribute('aria-label') || speakerNode?.textContent || 'Speaker');
      socket.send(JSON.stringify({ type: 'caption', speaker: speaker.slice(0, 100), text }));
    }
  }
  function start(config) {
    if (active) return;
    if (!config?.backendUrl || !config?.token) return;
    const base = config.backendUrl.replace(/\\/$/, '').replace(/^http/, 'ws');
    socket = new WebSocket(base + '/meetings/live?token=' + encodeURIComponent(config.token));
    socket.onopen = () => {
      active = true;
      seen.clear();
      socket.send(JSON.stringify({ type: 'start', title: document.title.replace(/\\s*-\\s*Google Meet.*$/i, '') || 'Google Meet', meeting_url: location.href }));
      emit(document);
      observer = new MutationObserver((mutations) => mutations.forEach(m => { if (m.target?.nodeType === 1) emit(m.target); else if (m.target?.parentElement) emit(m.target.parentElement); }));
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });
      chrome.runtime.sendMessage({ type: 'capture-status', active: true });
    };
    socket.onclose = () => { active = false; observer?.disconnect(); observer = null; chrome.runtime.sendMessage({ type: 'capture-status', active: false }); };
    socket.onerror = () => chrome.runtime.sendMessage({ type: 'capture-error', message: 'Could not connect to NOTE OS. Check backend URL and sign-in token.' });
    socket.onmessage = (event) => { try { chrome.runtime.sendMessage({ type: 'server-event', event: JSON.parse(event.data) }); } catch {} };
  }
  function stop() {
    if (!socket) return;
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'stop' }));
    active = false;
    observer?.disconnect(); observer = null;
    setTimeout(() => { if (socket && socket.readyState < WebSocket.CLOSING) socket.close(); }, 1000);
  }
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'start-capture') start(message.config);
    if (message.type === 'stop-capture') stop();
  });
})();
