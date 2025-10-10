export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeUrl(url: string): string {
  if (!url) return "#";
  const trimmed = url.trim();
  // Allow only safe protocols
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return "#";
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Fallback for non-browser environments: remove script tags and common event handlers
  if (typeof window === "undefined" || typeof document === "undefined") {
    return html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/ on[a-z]+\s*=\s*(\".*?\"|'.*?'|[^\s>]+)/gi, "");
  }

  const template = document.createElement("template");
  template.innerHTML = html;

  const blocklistTags = new Set(["SCRIPT", "IFRAME", "OBJECT", "EMBED"]);

  const sanitizeNode = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;

      // Remove blocked elements entirely
      if (blocklistTags.has(el.tagName)) {
        el.remove();
        return;
      }

      // Remove event handler attributes and javascript: URLs
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();
        const value = attr.value;

        if (name.startsWith("on")) {
          el.removeAttribute(attr.name);
          continue;
        }

        if (name === "href" || name === "src" || name === "xlink:href") {
          if (/^javascript:/i.test(value) || /^vbscript:/i.test(value)) {
            el.setAttribute(attr.name, "#");
          }
        }
      }

      // Recursively sanitize children
      for (const child of Array.from(el.childNodes)) sanitizeNode(child);
    }
  };

  for (const child of Array.from(template.content.childNodes)) sanitizeNode(child);

  return template.innerHTML;
}
