const http = require("node:http");

const PORT = Number(process.env.PORT || 10000);
const configuredUpstream = (process.env.UPSTREAM_FRONTEND || "").trim();
if (!configuredUpstream) {
  console.error("UPSTREAM_FRONTEND is required (Render service host for noteos-frontend).");
  process.exit(1);
}
const UPSTREAM = new URL(
  configuredUpstream.startsWith("http://") || configuredUpstream.startsWith("https://")
    ? configuredUpstream
    : `https://${configuredUpstream}`
);

const manifest = {
  id: "/",
  name: "NOTE OS",
  short_name: "NOTE OS",
  description: "A calm workspace for notes, ideas, and recall.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "any",
  background_color: "#f7f8f6",
  theme_color: "#6f927d",
  icons: [{ src: "/icons/noteos.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }]
};

const serviceWorker = `const CACHE = "noteos-pwa-shell-v1";
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(["/offline.html"])));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith("noteos-pwa-") && key !== CACHE).map(key => caches.delete(key))
  )));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  const path = new URL(req.url).pathname;
  if (path.startsWith("/api/") || path.startsWith("/auth/") ||
      path.startsWith("/notes") || path.startsWith("/workspaces") ||
      path.startsWith("/oauth/") || path.startsWith("/.well-known/")) return;
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(async () => (await caches.match("/offline.html")) || Response.error()));
  }
});`;

const offline = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#6f927d"><title>Offline · NOTE OS</title><style>body{font:16px system-ui;margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f8f6;color:#24332a}main{max-width:28rem;padding:2rem;text-align:center}p{color:#647268;line-height:1.6}button{border:0;border-radius:99px;padding:.8rem 1.2rem;background:#6f927d;color:white;font:inherit}</style><main><h1>You're offline</h1><p>Connect to the internet to safely load your NOTE OS workspace. Private notes are not stored in this offline cache.</p><button onclick="location.reload()">Try again</button></main></html>`;

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#6f927d"/><rect x="117" y="112" width="278" height="288" rx="28" fill="#f7f8f6"/><path d="M178 190h156M178 246h156M178 302h104" fill="none" stroke="#6f927d" stroke-width="22" stroke-linecap="round"/></svg>`;

function send(res, status, type, body) {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff" });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (requestUrl.pathname === "/manifest.webmanifest") {
    return send(res, 200, "application/manifest+json; charset=utf-8", JSON.stringify(manifest));
  }
  if (requestUrl.pathname === "/sw.js") {
    res.writeHead(200, { "content-type": "application/javascript; charset=utf-8", "service-worker-allowed": "/", "cache-control": "no-cache" });
    return res.end(serviceWorker);
  }
  if (requestUrl.pathname === "/offline.html") return send(res, 200, "text/html; charset=utf-8", offline);
  if (requestUrl.pathname === "/icons/noteos.svg") return send(res, 200, "image/svg+xml", icon);

  try {
    const target = new URL(requestUrl.pathname + requestUrl.search, UPSTREAM);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (["host", "connection", "content-length"].includes(key.toLowerCase()) || value == null) continue;
      if (Array.isArray(value)) headers.set(key, value.join(", "));
      else headers.set(key, value);
    }
    headers.set("x-forwarded-host", req.headers.host || "");
    headers.set("x-forwarded-proto", "https");

    const hasBody = !["GET", "HEAD"].includes(req.method);
    const body = hasBody ? await new Promise((resolve, reject) => {
      const chunks = [];
      req.on("data", chunk => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    }) : undefined;

    const upstreamResponse = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: "manual"
    });

    const responseHeaders = {};
    upstreamResponse.headers.forEach((value, key) => {
      if (!["transfer-encoding", "connection", "content-length", "content-encoding"].includes(key.toLowerCase())) {
        responseHeaders[key] = value;
      }
    });
    const cookies = typeof upstreamResponse.headers.getSetCookie === "function"
      ? upstreamResponse.headers.getSetCookie()
      : (upstreamResponse.headers.get("set-cookie") ? [upstreamResponse.headers.get("set-cookie")] : []);
    if (cookies.length) responseHeaders["set-cookie"] = cookies;

    if ([301, 302, 303, 307, 308].includes(upstreamResponse.status)) {
      const location = upstreamResponse.headers.get("location");
      if (location) {
        const redirected = new URL(location, UPSTREAM);
        if (redirected.origin === UPSTREAM.origin) {
          responseHeaders.location = `https://${req.headers.host}${redirected.pathname}${redirected.search}`;
        } else {
          responseHeaders.location = location;
        }
      }
      res.writeHead(upstreamResponse.status, responseHeaders);
      return res.end();
    }

    const contentType = upstreamResponse.headers.get("content-type") || "application/octet-stream";
    let payload = Buffer.from(await upstreamResponse.arrayBuffer());

    if (req.method !== "HEAD" && contentType.includes("text/html") && payload.length < 5_000_000) {
      let html = payload.toString("utf8");
      const injection = `
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/noteos.svg">
<meta name="theme-color" content="#6f927d">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="NOTE OS">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<script>
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .catch(function (error) { console.error("NOTE OS PWA registration failed", error); });
  });
}
</script>`;
      if (!html.includes('rel="manifest"')) html = html.replace(/<head([^>]*)>/i, `<head$1>${injection}`);
      payload = Buffer.from(html);
      delete responseHeaders.etag;
      delete responseHeaders["last-modified"];
    }
    if (req.method === "HEAD") payload = Buffer.alloc(0);
    responseHeaders["content-length"] = String(payload.length);
    res.writeHead(upstreamResponse.status, responseHeaders);
    res.end(payload);
  } catch (error) {
    console.error("PWA upstream request failed:", error);
    send(res, 502, "text/plain; charset=utf-8", "NOTE OS PWA could not reach the frontend service.");
  }
});

server.listen(PORT, "0.0.0.0", () => console.log(`NOTE OS PWA proxy listening on ${PORT}; upstream=${UPSTREAM.origin}`));
