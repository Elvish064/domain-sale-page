import assert from "node:assert/strict";
import test from "node:test";
import worker, { escapeHtml, getDomain, renderPage } from "../src/index.ts";

const env = { CONTACT_EMAIL: "sales@example.com", PREVIEW_DOMAIN: "preview.example" };

test("hostname normalization preserves subdomains and excludes ports", () => {
  for (const [url, expected] of [
    ["https://www.Example.com:8443/", "example.com"],
    ["https://shop.example.com/", "shop.example.com"],
    ["https://example.com./", "example.com"],
  ]) assert.equal(getDomain(new URL(url), env), expected);
});

test("preview override only applies to local loopback hosts", () => {
  for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
    assert.equal(getDomain(new URL(`http://${host}:8787/`), env), "preview.example");
  }
  assert.equal(getDomain(new URL("https://real.example/?domain=fake.example"), env), "real.example");
  assert.equal(getDomain(new URL("https://domain-sale.account.workers.dev/"), env), "domain-sale.account.workers.dev");
});

test("different domains render independent banners, titles, and mail subjects", async () => {
  for (const domain of ["first.example", "second.example"]) {
    const response = worker.fetch(new Request(`https://${domain}/`, {
      headers: { "X-Forwarded-Host": "fake.example" },
    }), env);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes(`<title>${domain} — This domain is for sale</title>`));
    assert.ok(html.includes(`https://ascii.rest/banner/${domain}.svg?tagline=This%20domain%20is%20for%20sale`));
    assert.ok(html.includes(`subject=Domain%20inquiry%3A%20${domain}`));
    assert.ok(!html.includes("fake.example"));
  }
});

test("untrusted text is escaped and email URI content is encoded", () => {
  assert.equal(escapeHtml(`<&>"'`), "&lt;&amp;&gt;&quot;&#39;");
  const html = renderPage("example.com", 'a"<script>@example.com');
  assert.ok(!html.includes('a"<script>'));
  assert.ok(html.includes("a%22%3Cscript%3E%40example.com"));
});

test("HEAD has no body and other methods return 405", async () => {
  const head = worker.fetch(new Request("https://example.com/", { method: "HEAD" }), env);
  assert.equal(await head.text(), "");
  assert.equal(head.headers.get("Content-Type"), "text/html; charset=utf-8");
  const post = worker.fetch(new Request("https://example.com/", { method: "POST" }), env);
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("Allow"), "GET, HEAD");
});
