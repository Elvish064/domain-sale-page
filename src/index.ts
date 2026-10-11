export interface Env {
  CONTACT_EMAIL?: string;
  PREVIEW_DOMAIN?: string;
}

export function getDomain(url: URL, env: Env): string {
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const hostname = local && env.PREVIEW_DOMAIN
    ? new URL(`https://${env.PREVIEW_DOMAIN}`).hostname
    : url.hostname;
  return hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

export function renderPage(domain: string, email = ""): string {
  const name = escapeHtml(domain);
  const tagline = "This domain is for sale.";
  email = email.trim();
  const banner = `https://ascii.rest/banner/${encodeURIComponent(domain)}.svg`;
  const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Domain inquiry: ${domain}`)}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="description" content="${name} is available for purchase. Contact the owner to make an offer.">
  <title>${name} — This domain is for sale</title>
  <link rel="icon" href="data:,">
  <style>
    :root { color-scheme: dark; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: #000; color: #fff; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100svh; display: grid; place-items: center; padding: 32px 20px; }
    main { width: min(100%, 960px); text-align: center; }
    .banner { position: relative; width: 100%; margin: 0; min-height: 160px; display: grid; align-items: center; }
    .fallback { grid-area: 1 / 1; padding: 24px 0; }
    h1 { font-size: clamp(28px, 6vw, 64px); font-weight: 500; letter-spacing: -.05em; margin: 0 0 20px; overflow-wrap: anywhere; }
    .tagline { margin: 24px auto 0; width: ${tagline.length}ch; max-width: 100%; color: #aaa; font-size: clamp(12px, 3vw, 14px); }
    .typed { box-sizing: content-box; display: block; width: 100%; overflow: hidden; white-space: nowrap; text-align: left; border-right: 1px solid #aaa; animation: typing 1.8s steps(${tagline.length}, end) both, cursor 1s step-end infinite; }
    @keyframes typing { from { width: 0; } to { width: 100%; } }
    @keyframes cursor { 50% { border-color: transparent; } }
    @media (prefers-reduced-motion: reduce) { .typed { animation: none; border-right: none; } }
    .banner img { grid-area: 1 / 1; position: relative; width: 100%; height: auto; display: block; background: #fff; filter: grayscale(1) invert(1); }
    [hidden] { display: none !important; }
    .contact { margin-top: 44px; padding-top: 24px; position: relative; }
    .contact::before { content: ''; position: absolute; top: 0; left: calc(50% - 20px); width: 40px; height: 1px; background: #333; }
    .label { display: block; color: #777; font-size: 10px; letter-spacing: .2em; text-transform: uppercase; margin-bottom: 14px; }
    a { color: #ddd; font-size: clamp(13px, 2.4vw, 16px); text-decoration: none; text-underline-offset: 6px; overflow-wrap: anywhere; }
    a:hover { color: #fff; text-decoration: underline; }
    a:focus-visible { outline: 1px solid #fff; outline-offset: 8px; border-radius: 2px; }
    @media (max-width: 600px) { .banner { min-height: 100px; } .contact { margin-top: 30px; } }
  </style>
</head>
<body>
  <main aria-label="Domain for sale">
    <div class="banner">
      <div class="fallback" id="fallback"><h1>${name}</h1></div>
      <img id="banner" hidden src="${escapeHtml(banner)}" alt="${name} — This domain is for sale">
    </div>
    <p class="tagline" aria-label="${tagline}"><span class="typed" aria-hidden="true">${tagline}</span></p>
    ${email ? `<div class="contact"><span class="label">Contact to purchase</span><a href="${escapeHtml(mailto)}">${escapeHtml(email)}</a></div>` : ""}
  </main>
  <script>
    const banner = document.getElementById('banner');
    const fallback = document.getElementById('fallback');
    function showBanner() { if (banner.naturalWidth > 0) { banner.hidden = false; fallback.hidden = true; } }
    banner.addEventListener('load', showBanner);
    banner.addEventListener('error', () => { banner.hidden = true; fallback.hidden = false; });
    if (banner.complete) showBanner();
  </script>
</body>
</html>`;
}

export default {
  fetch(request: Request, env: Env): Response {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const domain = getDomain(new URL(request.url), env);
    return new Response(request.method === "HEAD" ? null : renderPage(domain, env.CONTACT_EMAIL), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  },
};
