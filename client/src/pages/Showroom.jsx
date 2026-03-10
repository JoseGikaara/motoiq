import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { showroom } from "../api";

export default function Showroom() {
  const { dealerId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    showroom.get(dealerId).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [dealerId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Loading…</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Not found.</div>;

  const { dealer, cars } = data;
  const primary = dealer.primaryColor || "#2563EB";
  const phone = dealer.phone ? String(dealer.phone).replace(/\D/g, "") : "";
  const wa = phone ? (phone.startsWith("0") ? "254" + phone.slice(1) : phone.startsWith("254") ? phone : "254" + phone) : "";
  const whatsapp = wa ? "https://wa.me/" + wa : null;

  return (
    <div className="min-h-screen bg-navy">
      <header className="border-b border-white/10 py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {dealer.logoUrl && <img src={dealer.logoUrl} alt="" className="h-12 w-auto object-contain" />}
            <div>
              <h1 className="font-heading font-bold text-2xl text-white">{dealer.dealershipName}</h1>
              {dealer.tagline && <p className="text-gray-400 text-sm mt-0.5">{dealer.tagline}</p>}
            </div>
          </div>
          {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-white font-medium bg-green-600">Contact WhatsApp</a>}
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {cars.length === 0 ? <p className="text-gray-400 text-center py-12">No cars listed.</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <div key={car.id} className="bg-navy-card rounded-xl border border-white/5 overflow-hidden shadow-card">
                <div className="aspect-video bg-navy-light flex items-center justify-center">
                  {car.photos?.length > 0 ? <img src={car.photos[0]} alt="" className="w-full h-full object-cover" /> : <span className="text-gray-500 text-4xl font-heading">{car.make?.slice(0, 1)}</span>}
                </div>
                <div className="p-4">
                  <h2 className="font-heading font-semibold text-white">{car.make} {car.model}</h2>
                  <p className="text-sm text-gray-400">{car.year} · KES {(car.price || 0).toLocaleString()}</p>
                  <Link to={`/car/${car.id}`} className="mt-3 inline-block px-4 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: primary }}>View Car</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
