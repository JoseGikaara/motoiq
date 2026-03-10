import { useEffect } from "react";

/**
 * Injects dynamic meta tags and title for dealer website pages.
 * Use once per page; pass page-specific title/description or use defaults.
 */
export default function DealerMetaTags({
  dealer,
  title,
  description,
  image,
  path = "",
  type = "website",
}) {
  useEffect(() => {
    if (!dealer) return;
    const siteName = dealer.dealershipName || "Dealer";
    const location = dealer.city ? ` in ${dealer.city}` : "";
    const finalTitle = title || `${siteName} | Premium Cars${location}`;
    const finalDesc = description || dealer.tagline || `Browse quality vehicles at ${siteName}.`;

    document.title = finalTitle;

    const baseUrl = typeof window !== "undefined" ? window.location.origin + (path || window.location.pathname) : "";
    const ogImage = image || dealer.logoUrl || null;

    const setMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content || "");
    };

    setMeta("description", finalDesc);
    setMeta("og:title", finalTitle, true);
    setMeta("og:description", finalDesc, true);
    setMeta("og:type", type, true);
    if (baseUrl) setMeta("og:url", baseUrl, true);
    if (ogImage) setMeta("og:image", ogImage, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", finalTitle);
    setMeta("twitter:description", finalDesc);

    return () => {
      // Optional: reset to default on unmount if needed
    };
  }, [dealer, title, description, image, path, type]);

  return null;
}
