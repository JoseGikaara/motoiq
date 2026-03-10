import { useEffect, useRef } from "react";
import { carSlugFromCar } from "../../../utils/urlUtils";

/**
 * Injects JSON-LD structured data into document head.
 * variant: "dealer" | "car"
 */
export default function StructuredData({ variant, dealer, car }) {
  const scriptRef = useRef(null);

  useEffect(() => {
    if (!dealer && variant !== "car") return;
    if (variant === "car" && !car) return;

    let data = null;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    if (variant === "dealer") {
      data = {
        "@context": "https://schema.org",
        "@type": "AutoDealer",
        name: dealer.dealershipName,
        description: dealer.tagline || `${dealer.dealershipName} - Quality vehicles`,
        url: `${baseUrl}/s/${dealer.websiteSlug || ""}`,
        ...(dealer.city && { address: { "@type": "PostalAddress", addressLocality: dealer.city } }),
        ...(dealer.phone && { telephone: dealer.phone }),
        ...(dealer.logoUrl && { image: dealer.logoUrl }),
      };
    }

    if (variant === "car" && car && dealer) {
      const carUrl = `${baseUrl}/s/${dealer.websiteSlug || ""}/inventory/${carSlugFromCar(car)}`;
      data = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `${car.year} ${car.make} ${car.model}`,
        description: (car.description || "").slice(0, 200) || `${car.year} ${car.make} ${car.model} for sale`,
        url: carUrl,
        ...(car.price != null && {
          offers: {
            "@type": "Offer",
            price: car.price,
            priceCurrency: "KES",
            availability: "https://schema.org/InStock",
          },
        }),
        ...(car.mileage != null && { mileage: car.mileage }),
        vehicleModelDate: car.year,
        brand: { "@type": "Brand", name: car.make },
        model: car.model,
      };
    }

    if (!data) return;

    const json = JSON.stringify(data);
    let el = document.getElementById("structured-data-dealer");
    if (variant === "car") el = document.getElementById("structured-data-car");
    if (el) el.remove();

    const script = document.createElement("script");
    script.id = variant === "car" ? "structured-data-car" : "structured-data-dealer";
    script.type = "application/ld+json";
    script.textContent = json;
    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      scriptRef.current?.remove();
    };
  }, [variant, dealer, car]);

  return null;
}
