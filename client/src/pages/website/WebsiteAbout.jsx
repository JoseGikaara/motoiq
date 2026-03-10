import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { MapPin, PhoneCall, Mail } from "lucide-react";
import { publicSite } from "../../api";
import DealerNavbar from "../../components/website/DealerNavbar";

function dealerWhatsappNumber(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("254")) return digits;
  return `254${digits}`;
}

export default function WebsiteAbout() {
  const { slug } = useParams();
  const [dealer, setDealer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolvedSlug, setResolvedSlug] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const d =
          slug === "host"
            ? await publicSite.getByHost(window.location.hostname)
            : await publicSite.getBySlug(slug);
        if (cancelled) return;
        setDealer(d);
        setResolvedSlug(d.websiteSlug || slug);
        document.title = `${d.dealershipName} | About`;
      } catch (e) {
        if (!cancelled) toast.error(e.message || "Dealer website not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading && !dealer) {
    return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Loading…</div>;
  }
  if (!dealer) {
    return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Dealer website not found.</div>;
  }

  const primaryColor = dealer.primaryColor || "#2563EB";
  const waNumber = dealer.phone ? dealerWhatsappNumber(dealer.phone) : "";
  const whatsapp = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Hi, I'm interested in your cars.")}` : null;
  const mapsQuery = encodeURIComponent(`${dealer.dealershipName || ""} ${dealer.city || ""} Kenya`.trim());
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <div className="min-h-screen bg-navy text-white">
      <DealerNavbar dealer={dealer} slug={slug} resolvedSlug={resolvedSlug} />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <section>
          <h1 className="font-heading font-bold text-2xl mb-2">About {dealer.dealershipName}</h1>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">
            {dealer.aboutText ||
              "We are a Kenyan dealership focused on clean, well-maintained cars and honest transactions. Visit our yard to see our latest stock."}
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="bg-navy-card rounded-xl border border-white/10 p-4">
            <h2 className="font-heading font-semibold text-base mb-2">Contact</h2>
            <div className="space-y-2 text-gray-300">
              {dealer.phone && (
                <p className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-gray-400" />
                  <span>{dealer.phone}</span>
                </p>
              )}
              {dealer.email && (
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{dealer.email}</span>
                </p>
              )}
              {dealer.city && (
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{dealer.city}, Kenya</span>
                </p>
              )}
            </div>
          </div>
          <div className="bg-navy-card rounded-xl border border-white/10 p-4 md:col-span-2">
            <h2 className="font-heading font-semibold text-base mb-2">Find us</h2>
            <p className="text-xs text-gray-300 mb-3">
              Use the map link below to open our location in Google Maps and get directions to the yard.
            </p>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 text-xs hover:bg-white/5"
            >
              <MapPin className="w-4 h-4" />
              Open in Google Maps
            </a>
          </div>
        </section>

        <section className="bg-navy-card rounded-xl border border-white/10 p-4 text-xs text-gray-400">
          <p>
            This website is powered by <span className="font-semibold text-accent-blue">MotorIQ</span> — the CRM and
            showroom platform built for Kenyan car dealers.
          </p>
        </section>
      </main>

      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white text-sm font-medium shadow-lg shadow-black/50"
        >
          WhatsApp us
        </a>
      )}
    </div>
  );
}

