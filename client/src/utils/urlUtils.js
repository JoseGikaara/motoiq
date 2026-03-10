/**
 * Build SEO-friendly car slug: make-model-year-id (lowercase, hyphens).
 * Used for URLs like /s/demo-showroom/inventory/toyota-land-cruiser-2023-clx123
 */
export function carSlugFromCar(car) {
  if (!car?.id) return "";
  const make = sanitizeSlug(car.make || "");
  const model = sanitizeSlug(car.model || "");
  const year = String(car.year || "").replace(/\D/g, "") || "0";
  return [make, model, year, car.id].filter(Boolean).join("-");
}

/**
 * Sanitize a string for URL slug: lowercase, replace spaces/special with hyphens, collapse.
 */
export function sanitizeSlug(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "";
}

/**
 * Extract car ID from SEO slug. Format: ...-year-id (id is last segment, no hyphens in cuid).
 */
export function parseCarIdFromSlug(carSlug) {
  if (!carSlug || typeof carSlug !== "string") return null;
  const parts = carSlug.split("-").filter(Boolean);
  if (parts.length < 2) return null;
  // Last segment is the id (cuid is alphanumeric, no hyphens)
  const id = parts[parts.length - 1];
  return id || null;
}
