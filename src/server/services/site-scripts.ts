import "server-only";

import { getSettings } from "./settings";

function escAttr(v: string): string {
  return v.replace(/"/g, "&quot;");
}

/**
 * Build <head> and pre-</body> HTML from settings: native analytics tracker +
 * external integrations (GA / GSC / Clarity). All optional.
 */
export async function getSiteScripts(): Promise<{
  head: string;
  body: string;
}> {
  const s = await getSettings();
  const head: string[] = [];
  const body: string[] = [];

  const gsc = s["integrations.gsc"];
  if (typeof gsc === "string" && gsc.trim()) {
    head.push(
      `<meta name="google-site-verification" content="${escAttr(gsc)}" />`,
    );
  }

  const ga = s["integrations.ga"];
  if (typeof ga === "string" && ga.trim()) {
    const id = escAttr(ga);
    head.push(
      `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`,
      `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');</script>`,
    );
  }

  const clarity = s["integrations.clarity"];
  if (typeof clarity === "string" && clarity.trim()) {
    const id = escAttr(clarity);
    head.push(
      `<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${id}");</script>`,
    );
  }

  // Native first-party analytics (default on unless explicitly disabled).
  if (s["analytics.enabled"] !== false) {
    body.push('<script src="/flx-analytics.js" defer></script>');
  }

  return { head: head.join(""), body: body.join("") };
}

/** Inject the site scripts into a rendered HTML document. */
export async function injectSiteScripts(html: string): Promise<string> {
  const { head, body } = await getSiteScripts();
  let out = html;
  if (head && out.includes("</head>")) {
    out = out.replace("</head>", `${head}</head>`);
  }
  if (body && out.includes("</body>")) {
    out = out.replace("</body>", `${body}</body>`);
  }
  return out;
}
