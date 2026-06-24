// Shared SEO analysis (client preview + server persistence). Pure, no DOM.

export type SeoCheckStatus = "good" | "warn" | "bad";
export type SeoCheck = {
  id: string;
  label: string;
  status: SeoCheckStatus;
  message: string;
};
export type SeoAnalysis = { score: number; checks: SeoCheck[] };

export type SeoInput = {
  title: string; // entry title (fallback)
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  contentHtml?: string | null;
};

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return (haystack.match(re) ?? []).length;
}

export function analyzeSeo(input: SeoInput): SeoAnalysis {
  const html = input.contentHtml ?? "";
  const text = stripTags(html);
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const title = (input.metaTitle || input.title || "").trim();
  const desc = (input.metaDescription || "").trim();
  const kw = (input.focusKeyword || "").trim().toLowerCase();

  const checks: SeoCheck[] = [];
  const add = (
    id: string,
    label: string,
    status: SeoCheckStatus,
    message: string,
  ) => checks.push({ id, label, status, message });

  // Title length
  if (!title) add("title", "SEO title", "bad", "Add an SEO title.");
  else if (title.length < 30)
    add("title", "SEO title", "warn", "Title is a bit short (aim 30–60).");
  else if (title.length > 60)
    add("title", "SEO title", "warn", "Title is long (aim 30–60).");
  else add("title", "SEO title", "good", "Title length is ideal.");

  // Meta description
  if (!desc) add("desc", "Meta description", "bad", "Add a meta description.");
  else if (desc.length < 120)
    add("desc", "Meta description", "warn", "Description short (aim 120–160).");
  else if (desc.length > 160)
    add("desc", "Meta description", "warn", "Description long (aim 120–160).");
  else add("desc", "Meta description", "good", "Description length is ideal.");

  // Content length
  if (wordCount < 300)
    add(
      "length",
      "Content length",
      wordCount < 100 ? "bad" : "warn",
      `${wordCount} words (aim 300+).`,
    );
  else add("length", "Content length", "good", `${wordCount} words.`);

  // Headings
  const headingCount = (html.match(/<h[2-6][\s>]/gi) ?? []).length;
  if (headingCount === 0)
    add("headings", "Subheadings", "warn", "No H2/H3 subheadings found.");
  else add("headings", "Subheadings", "good", `${headingCount} subheadings.`);

  // Links
  const internal = (html.match(/href="\/[^"]*"/gi) ?? []).length;
  const external = (html.match(/href="https?:\/\/[^"]*"/gi) ?? []).length;
  if (internal === 0 && external === 0)
    add("links", "Links", "warn", "No links in content.");
  else
    add(
      "links",
      "Links",
      "good",
      `${internal} internal, ${external} external.`,
    );

  // Image alt coverage
  const imgs = html.match(/<img[^>]*>/gi) ?? [];
  if (imgs.length > 0) {
    const withAlt = imgs.filter((i) => /alt="[^"]+"/i.test(i)).length;
    if (withAlt < imgs.length)
      add(
        "alt",
        "Image alt text",
        "warn",
        `${withAlt}/${imgs.length} images have alt text.`,
      );
    else add("alt", "Image alt text", "good", "All images have alt text.");
  }

  // Focus keyword analysis
  if (!kw) {
    add("keyword", "Focus keyword", "warn", "Set a focus keyword.");
  } else {
    add(
      "kw-title",
      "Keyword in title",
      title.toLowerCase().includes(kw) ? "good" : "bad",
      title.toLowerCase().includes(kw)
        ? "Keyword appears in the title."
        : "Keyword missing from the title.",
    );
    add(
      "kw-desc",
      "Keyword in description",
      desc.toLowerCase().includes(kw) ? "good" : "warn",
      desc.toLowerCase().includes(kw)
        ? "Keyword appears in the description."
        : "Keyword missing from the description.",
    );
    const firstChunk = text.slice(0, 200).toLowerCase();
    add(
      "kw-intro",
      "Keyword in intro",
      firstChunk.includes(kw) ? "good" : "warn",
      firstChunk.includes(kw)
        ? "Keyword appears early in the content."
        : "Keyword not found in the opening.",
    );
    const occ = countOccurrences(text.toLowerCase(), kw);
    const density = wordCount ? (occ / wordCount) * 100 : 0;
    if (density === 0)
      add("density", "Keyword density", "bad", "Keyword not used in content.");
    else if (density < 0.5)
      add(
        "density",
        "Keyword density",
        "warn",
        `Low density (${density.toFixed(1)}%).`,
      );
    else if (density > 2.5)
      add(
        "density",
        "Keyword density",
        "warn",
        `High density (${density.toFixed(1)}%) — avoid stuffing.`,
      );
    else
      add(
        "density",
        "Keyword density",
        "good",
        `Density ${density.toFixed(1)}%.`,
      );
  }

  // Score
  const weight = (s: SeoCheckStatus) =>
    s === "good" ? 1 : s === "warn" ? 0.5 : 0;
  const score = checks.length
    ? Math.round(
        (checks.reduce((sum, c) => sum + weight(c.status), 0) / checks.length) *
          100,
      )
    : 0;

  return { score, checks };
}

export function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}
