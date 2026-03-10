import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { publicSite } from "../../api";
import { carSlugFromCar } from "../../utils/urlUtils";

/**
 * When user hits old URL /s/:slug/car/:carId, fetch car and redirect to SEO URL.
 */
export default function WebsiteCarRedirect() {
  const { slug, carId } = useParams();
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const dealer =
          slug === "host"
            ? await publicSite.getByHost(window.location.hostname)
            : await publicSite.getBySlug(slug);
        if (cancelled) return;
        const slugForApi = dealer.websiteSlug || slug;
        const car = await publicSite.getCar(slugForApi, carId);
        if (cancelled) return;
        const carSlug = carSlugFromCar(car);
        setTarget(`/s/${slugForApi}/inventory/${carSlug}`);
      } catch {
        setTarget(`/s/${slug}/inventory`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [slug, carId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Redirecting…</div>;
  return <Navigate to={target || `/s/${slug}/inventory`} replace />;
}
