import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { cars as carsApi } from "../api";
import { getApiBase } from "../config/apiBase";
import AddCarModal from "../components/AddCarModal";
import PhotoManager from "../components/dashboard/cars/PhotoManager";
import FacebookPostsModal from "../components/FacebookPostsModal";
import FacebookRepliesModal from "../components/FacebookRepliesModal";
import { useAuth } from "../context/AuthContext";

export default function Cars() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [photoManagerCar, setPhotoManagerCar] = useState(null);
  const [facebookPostsCar, setFacebookPostsCar] = useState(null);
  const [facebookRepliesCar, setFacebookRepliesCar] = useState(null);
  const [copyDropdownId, setCopyDropdownId] = useState(null);

  const fetchCars = () => carsApi.list().then(setList).catch((e) => toast.error(e.message)).finally(() => setLoading(false));

  useEffect(() => {
    fetchCars();
  }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this car?")) return;
    try {
      await carsApi.delete(id);
      toast.success("Car deleted");
      setList((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      toast.error(e.message);
    }
  }

  const apiBase = (getApiBase() || window.location.origin).replace(/\/$/, "");

  function copyLink(id, src) {
    const base = `${window.location.origin}/car/${id}`;
    const url = src ? `${base}?src=${src}` : base;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
    setCopyDropdownId(null);
  }

  function copyShortLink(id) {
    const url = `${apiBase}/go/car/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Short link copied!");
    setCopyDropdownId(null);
  }

  function shareViaWhatsApp(car) {
    const carUrl = `${window.location.origin}/car/${car.id}`;
    const text = `Check out this ${car.year} ${car.make} ${car.model} available for KES ${(car.price || 0).toLocaleString()}. ${carUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-navy-card rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Cars</h1>
          <p className="text-gray-400 mt-0.5">Manage inventory and landing page links</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBulkModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium border border-white/10 hover:bg-slate-700 transition"
          >
            Bulk Upload Cars
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-accent-blue text-white font-medium hover:bg-accent-blue/90 transition"
          >
            Add Car
          </button>
        </div>
      </div>

      {user?.id && (
        <div className="bg-navy-card rounded-xl border border-white/5 p-4 shadow-card flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-400">My Showroom Link</p>
            <p className="text-white font-mono text-sm truncate">{typeof window !== "undefined" ? `${window.location.origin}/showroom/${user.id}` : ""}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const url = `${window.location.origin}/showroom/${user.id}`;
                navigator.clipboard.writeText(url);
                toast.success("Copied!");
              }}
              className="px-3 py-1.5 rounded-lg bg-navy border border-white/20 text-sm text-gray-300 hover:text-white"
            >
              Copy
            </button>
            <a
              href={typeof window !== "undefined" ? `https://wa.me/?text=${encodeURIComponent(`Check out our cars: ${window.location.origin}/showroom/${user.id}`)}` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-500"
            >
              Share on WhatsApp
            </a>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="bg-navy-card rounded-xl border border-white/5 p-12 text-center">
          <p className="text-gray-400 mb-4">No cars yet. Add your first listing to start capturing leads.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-accent-blue text-white font-medium hover:bg-accent-blue/90"
          >
            Add Car
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((car) => (
            <div key={car.id} className="bg-navy-card rounded-xl border border-white/5 overflow-hidden shadow-card">
              <div className="aspect-video bg-navy-light flex items-center justify-center">
                {(car.carPhotos?.[0]?.url || car.photos?.[0]) ? (
                  <img src={car.carPhotos?.[0]?.url || car.photos[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500 text-4xl font-heading">{car.make?.slice(0, 1)}</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-heading font-semibold text-white">{car.make} {car.model}</h3>
                <p className="text-sm text-gray-400">{car.year} · KES {(car.price || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-400 mt-1">{car._count?.leads ?? 0} leads</p>
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <button type="button" onClick={() => setPhotoManagerCar(car)} className="text-sm text-accent-blue hover:underline">
                    Manage photos
                  </button>
                  <button type="button" onClick={() => setFacebookPostsCar(car)} className="text-sm text-[#1877F2] hover:underline">
                    Generate Facebook Posts
                  </button>
                  <button type="button" onClick={() => setFacebookRepliesCar(car)} className="text-sm text-[#1877F2] hover:underline">
                    Facebook Comment Replies
                  </button>
                  <Link to={`/car/${car.id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-blue hover:underline">
                    View Landing Page
                  </Link>
                  <div className="relative">
                    <button onClick={() => setCopyDropdownId(copyDropdownId === car.id ? null : car.id)} className="text-sm text-gray-400 hover:text-white">
                      Copy Link ▾
                    </button>
                    {copyDropdownId === car.id && (
                      <div className="absolute left-0 top-full mt-1 py-1 bg-navy-card border border-white/10 rounded-lg shadow-lg z-10 min-w-[180px]">
                        <button type="button" onClick={() => copyShortLink(car.id)} className="block w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5">Copy short link (Share Car)</button>
                        <button type="button" onClick={() => copyLink(car.id, "facebook")} className="block w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5">Copy Facebook Link</button>
                        <button type="button" onClick={() => copyLink(car.id, "instagram")} className="block w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5">Copy Instagram Link</button>
                        <button type="button" onClick={() => copyLink(car.id, "whatsapp")} className="block w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5">Copy WhatsApp Link</button>
                        <button type="button" onClick={() => copyLink(car.id)} className="block w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5">Copy General Link</button>
                      </div>
                    )}
                    <button type="button" onClick={() => shareViaWhatsApp(car)} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-500">
                      Share via WhatsApp
                    </button>
                  </div>
                  <button onClick={() => handleDelete(car.id)} className="text-sm text-red-400 hover:text-red-300 ml-auto">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddCarModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchCars(); }} />
      <PhotoManager open={!!photoManagerCar} onClose={() => setPhotoManagerCar(null)} car={photoManagerCar} />
      <FacebookPostsModal open={!!facebookPostsCar} onClose={() => setFacebookPostsCar(null)} car={facebookPostsCar} />
      <FacebookRepliesModal open={!!facebookRepliesCar} onClose={() => setFacebookRepliesCar(null)} car={facebookRepliesCar} />

      {/* Bulk upload modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60" onClick={() => { setBulkModalOpen(false); setBulkFile(null); setBulkResult(null); }}>
          <div
            className="w-full max-w-md bg-navy-card border border-white/10 rounded-2xl p-6 shadow-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading font-semibold text-lg text-white mb-2">
              Bulk Upload Cars
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Upload a CSV or Excel file to create many cars at once. Required columns:{" "}
              <span className="font-mono text-xs">make, model, year, price</span>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  File (CSV or XLSX)
                </label>
                <input
                  type="file"
                  accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-200 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-accent-blue file:text-white file:text-xs bg-navy border border-white/10 rounded-lg px-2 py-1.5"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const header = [
                    "make",
                    "model",
                    "year",
                    "price",
                    "mileage",
                    "fuelType",
                    "transmission",
                    "bodyType",
                    "color",
                    "description",
                    "hero",
                    "status",
                  ].join(",");
                  const example = [
                    "Toyota",
                    "Prado",
                    "2017",
                    "5800000",
                    "45000",
                    "Diesel",
                    "Automatic",
                    "SUV",
                    "Black",
                    "Clean import unit",
                    "true",
                    "AVAILABLE",
                  ].join(",");
                  const csv = `${header}\n${example}\n`;
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "motoriq-cars-template.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full px-3 py-2 rounded-lg border border-white/15 text-xs text-gray-200 hover:bg-white/5"
              >
                Download Sample Template (CSV)
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!bulkFile) {
                    toast.error("Please choose a CSV or Excel file first.");
                    return;
                  }
                  setBulkUploading(true);
                  setBulkResult(null);
                  try {
                    toast.loading("Uploading and processing cars…", { id: "bulk-cars" });
                    const result = await carsApi.bulkUpload(bulkFile);
                    setBulkResult(result);
                    toast.success("Cars uploaded successfully", { id: "bulk-cars" });
                    fetchCars();
                  } catch (e) {
                    toast.error(e.message || "Bulk upload failed", { id: "bulk-cars" });
                  } finally {
                    setBulkUploading(false);
                  }
                }}
                disabled={bulkUploading}
                className="w-full px-4 py-2 rounded-lg bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue/90 disabled:opacity-50"
              >
                {bulkUploading ? "Uploading & processing…" : "Upload"}
              </button>

              {bulkResult && (
                <div className="mt-3 rounded-lg bg-navy border border-white/10 p-3 text-xs text-gray-200 space-y-1">
                  <p>
                    <span className="font-semibold">Cars Created:</span>{" "}
                    {bulkResult.carsCreated ?? 0}
                  </p>
                  <p>
                    <span className="font-semibold">Rows Skipped:</span>{" "}
                    {bulkResult.rowsSkipped ?? 0}
                  </p>
                  {Array.isArray(bulkResult.errors) && bulkResult.errors.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto space-y-0.5">
                      {bulkResult.errors.map((err, idx) => (
                        <p key={`${err.row}-${idx}`} className="text-red-300">
                          Row {err.row}: {err.reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setBulkModalOpen(false);
                  setBulkFile(null);
                  setBulkResult(null);
                }}
                className="w-full mt-2 px-3 py-2 rounded-lg border border-white/15 text-xs text-gray-300 hover:bg-white/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
