import { Link } from "react-router-dom";
import { X } from "lucide-react";
import CarSpecsTable from "../../CarSpecsTable";
import { carSlugFromCar } from "../../../utils/urlUtils";

function dealerWhatsappNumber(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("254")) return digits;
  return `254${digits}`;
}

export default function QuickViewModal({ car, dealer, slug, primaryColor, onClose }) {
  if (!car || !dealer) return null;
  const resolvedSlug = dealer.websiteSlug || slug;
  const carPath = `/s/${resolvedSlug}/inventory/${carSlugFromCar(car)}`;
  const waNumber = dealer.phone ? dealerWhatsappNumber(dealer.phone) : "";
  const whatsapp = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi, I'm interested in this ${car.year} ${car.make} ${car.model}.`)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-white/10 bg-navy-card shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
      >
        <div className="sticky top-0 z-10 flex justify-end p-2 bg-navy-card/95">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 pt-0 space-y-4">
          <div className="aspect-video rounded-lg overflow-hidden bg-navy-light">
            {car.photos?.length ? (
              <img src={car.photos[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 font-heading text-3xl">
                {car.make?.slice(0, 1)}
              </div>
            )}
          </div>
          <h2 id="quick-view-title" className="font-heading font-bold text-xl">
            {car.year} {car.make} {car.model}
          </h2>
          <p className="text-accent-blue font-semibold text-lg">
            KES {(car.price || 0).toLocaleString()}
          </p>
          <CarSpecsTable car={car} specsString={car.specs} className="text-sm" />
          {car.description && (
            <p className="text-gray-400 text-sm line-clamp-3">{car.description}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              to={carPath}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: primaryColor }}
            >
              View full listing
            </Link>
            <Link
              to={`${carPath}#lead-form`}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium border border-white/20 text-white hover:bg-white/10"
            >
              Book test drive
            </Link>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-500"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
