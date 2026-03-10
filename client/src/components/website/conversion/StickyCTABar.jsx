import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Calendar, Percent, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { leads as leadsApi } from "../../../api";

function dealerWhatsappNumber(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("254")) return digits;
  return `254${digits}`;
}

export default function StickyCTABar({
  visible,
  car,
  dealer,
  slug,
  carDetailPath,
  primaryColor,
  onBookTestDrive,
  hasFinancing = true,
}) {
  const [waLoading, setWaLoading] = useState(false);
  const [callLoading, setCallLoading] = useState(false);

  if (!car || !dealer) return null;

  const waNumber = dealer.phone ? dealerWhatsappNumber(dealer.phone) : "";
  const whatsappMessage = `Hi, I'm interested in the ${car.year} ${car.make} ${car.model} listed for KES ${(car.price || 0).toLocaleString()}. Is it still available?`;
  const whatsappUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(whatsappMessage)}` : null;
  const telUrl = dealer.phone ? `tel:${dealer.phone.replace(/\s/g, "")}` : null;

  async function handleWhatsApp(e) {
    e.preventDefault();
    if (!whatsappUrl) return;
    setWaLoading(true);
    try {
      await leadsApi.createWhatsApp({
        carId: car.id,
        dealerId: dealer.id,
        message: whatsappMessage,
      });
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err.message || "Could not start chat");
    } finally {
      setWaLoading(false);
    }
  }

  async function handleCall(e) {
    e.preventDefault();
    if (!telUrl) return;
    setCallLoading(true);
    try {
      await leadsApi.createWidget({ carId: car.id, dealerId: dealer.id, source: "call" });
      window.open(telUrl, "_self");
    } catch (err) {
      toast.error(err.message || "Could not record call");
    } finally {
      setCallLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 dark:bg-navy-900/95 backdrop-blur-sm shadow-lg"
          style={{ borderTopColor: primaryColor, borderTopWidth: "2px" }}
        >
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy dark:text-white truncate">
                {car.year} {car.make} {car.model}
              </p>
              <p className="text-sm font-medium truncate" style={{ color: primaryColor }}>
                KES {(car.price || 0).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {telUrl && (
                <button
                  type="button"
                  onClick={handleCall}
                  disabled={callLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-navy/80 dark:bg-navy text-white hover:bg-navy/90 disabled:opacity-50"
                >
                  <Phone className="w-4 h-4" />
                  Call Dealer
                </button>
              )}
              <button
                type="button"
                onClick={onBookTestDrive}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <Calendar className="w-4 h-4" />
                Book Test Drive
              </button>
              {whatsappUrl && (
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  disabled={waLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  {waLoading ? "…" : "WhatsApp"}
                </button>
              )}
              {hasFinancing && carDetailPath && (
                <Link
                  to={`${carDetailPath}#financing`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/10 dark:bg-white/10 text-navy dark:text-white border border-white/20 hover:bg-white/20"
                >
                  <Percent className="w-4 h-4" />
                  Get Financing
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
