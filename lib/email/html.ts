import sanitizeHtml from "sanitize-html";

/** Escape user-supplied text for safe insertion into HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Allowlist sanitizer for model-generated email HTML: keeps the tags and
 * inline styles the prompts ask for, drops scripts, handlers and non-http links.
 */
export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "b", "i", "ul", "ol", "li", "h2", "h3", "h4", "a", "span", "div"],
    allowedAttributes: {
      "*": ["style", "class"],
      a: ["href", "style", "class", "target", "rel"],
    },
    allowedSchemes: ["http", "https"],
    allowedSchemesAppliedToAttributes: ["href"],
    allowProtocolRelative: false,
  });
}

/**
 * Fill {{placeholders}}. `text` values are escaped; `html` values are sanitized.
 */
export function renderTemplate(
  template: string,
  values: { text?: Record<string, string>; html?: Record<string, string> },
): string {
  let out = template;
  for (const [key, value] of Object.entries(values.text ?? {})) {
    out = out.split(`{{${key}}}`).join(escapeHtml(value));
  }
  for (const [key, value] of Object.entries(values.html ?? {})) {
    out = out.split(`{{${key}}}`).join(sanitizeEmailHtml(value));
  }
  return out;
}
