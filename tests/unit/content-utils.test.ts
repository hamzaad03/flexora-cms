import { describe, expect, it } from "vitest";

import { slugify, uniqueSlug } from "@/lib/slug";
import { sanitizeRichText } from "@/lib/sanitize";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });
  it("strips diacritics and trims separators", () => {
    expect(slugify("  Café —  Déjà Vu  ")).toBe("cafe-deja-vu");
  });
  it("collapses non-alphanumerics", () => {
    expect(slugify("a/b__c  d")).toBe("a-b-c-d");
  });
});

describe("uniqueSlug", () => {
  it("returns the base when free", async () => {
    expect(await uniqueSlug("My Page", async () => false)).toBe("my-page");
  });
  it("appends a counter on collision", async () => {
    const taken = new Set(["my-page", "my-page-2"]);
    expect(await uniqueSlug("My Page", async (s) => taken.has(s))).toBe(
      "my-page-3",
    );
  });
});

describe("sanitizeRichText", () => {
  it("removes script tags and event handlers", () => {
    const out = sanitizeRichText(
      '<p onclick="evil()">hi</p><script>alert(1)</script>',
    );
    expect(out).not.toContain("script");
    expect(out).not.toContain("onclick");
    expect(out).toContain("<p>hi</p>");
  });
  it("keeps allowed formatting and links", () => {
    const out = sanitizeRichText(
      '<p><strong>bold</strong> <a href="https://x.com">link</a></p>',
    );
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain('href="https://x.com"');
  });
  it("adds rel to target=_blank links", () => {
    const out = sanitizeRichText(
      '<a href="https://x.com" target="_blank">x</a>',
    );
    expect(out).toContain('rel="noopener noreferrer"');
  });
});
