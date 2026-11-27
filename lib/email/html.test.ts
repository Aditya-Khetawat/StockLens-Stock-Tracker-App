import { describe, expect, it } from "vitest";
import { escapeHtml, renderTemplate, sanitizeEmailHtml } from "./html";

describe("escapeHtml", () => {
  it("neutralizes markup in user-supplied text", () => {
    expect(escapeHtml(`<a href="https://evil.test">Claim prize</a> & "you"`)).toBe(
      "&lt;a href=&quot;https://evil.test&quot;&gt;Claim prize&lt;/a&gt; &amp; &quot;you&quot;",
    );
  });
});

describe("sanitizeEmailHtml", () => {
  it("keeps the formatting the prompts ask for", () => {
    const html = `<p class="mobile-text" style="color: #CCDADC;">Hi <strong style="color: #FDD458;">there</strong></p>`;
    // CSS whitespace is normalized; tags, classes and colours must survive.
    expect(sanitizeEmailHtml(html)).toBe(
      `<p class="mobile-text" style="color:#CCDADC">Hi <strong style="color:#FDD458">there</strong></p>`,
    );
  });

  it("removes scripts and event handlers", () => {
    const out = sanitizeEmailHtml(`<p onclick="steal()">ok</p><script>alert(1)</script><img src=x onerror=alert(1)>`);
    expect(out).not.toMatch(/script|onclick|onerror|<img/i);
    expect(out).toContain("<p>ok</p>");
  });

  it("only allows http(s) links", () => {
    const out = sanitizeEmailHtml(`<a href="javascript:alert(1)">x</a><a href="https://finnhub.io/n">y</a>`);
    expect(out).not.toMatch(/javascript:/i);
    expect(out).toContain(`href="https://finnhub.io/n"`);
  });
});

describe("renderTemplate", () => {
  it("escapes text values and sanitizes html values", () => {
    const out = renderTemplate("<h1>{{name}}</h1>{{intro}}", {
      text: { name: "<b>Eve</b>" },
      html: { intro: "<p>Hi</p><script>x()</script>" },
    });
    expect(out).toBe("<h1>&lt;b&gt;Eve&lt;/b&gt;</h1><p>Hi</p>");
  });

  it("replaces every occurrence of a placeholder", () => {
    expect(renderTemplate("{{a}}-{{a}}", { text: { a: "1" } })).toBe("1-1");
  });
});
