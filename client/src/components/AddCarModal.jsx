import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { cars as carsApi, uploadCarImage, uploadCarVideo, ai } from "../api";

const BODY_TYPES = ["Hatchback", "Saloon / Sedan", "Station Wagon", "SUV", "Pickup", "Van"];
const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric"];
const TRANSMISSIONS = ["Automatic", "Manual", "CVT"];
const COLORS = ["White", "Silver", "Black", "Grey", "Blue", "Red", "Green", "Brown", "Other"];
const PHOTO_ANGLES = ["", "Front", "Side", "Rear", "Interior", "Engine", "360 View", "Other"];

function yearOptions() {
  const thisYear = new Date().getFullYear();
  const years = [];
  for (let y = thisYear; y >= 1995; y -= 1) years.push(y);
  return years;
}

export default function AddCarModal({ open, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    price: "",
    mileage: "",
    color: "",
    bodyType: "",
    fuelType: "",
    transmission: "",
    specs: "",
    description: "",
    photos: [],
    photoGallery: [],
    isFeaturedInTopMarquee: false,
    isFeaturedInCinematicHero: false,
    heroDisplayOrder: "",
    heroOverlayText: "",
    discountPercentage: "",
    saleEndDate: "",
    videoUrl: "",
    videoThumbnailUrl: "",
    isVideoBackground: false,
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  function getGallery() {
    const g = form.photoGallery?.length ? form.photoGallery : (form.photos || []).map((url, i) => ({ url, angle: "", order: i }));
    return Array.isArray(g) ? g : [];
  }

  async function addPhotosFromFiles(files) {
    if (!files?.length) return;
    const gallery = getGallery();
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const url = await uploadCarImage(file);
        gallery.push({ url, angle: "", order: gallery.length });
      } catch (e) {
        toast.error(e.message || "Upload failed");
      }
    }
    setForm((f) => ({ ...f, photoGallery: gallery, photos: gallery.map((x) => x.url) }));
  }

  function addPhotoUrl() {
    const data = prompt("Paste image URL:");
    if (!data) return;
    const gallery = getGallery();
    gallery.push({ url: data.trim(), angle: "", order: gallery.length });
    setForm((f) => ({ ...f, photoGallery: gallery, photos: gallery.map((x) => x.url) }));
  }

  function removePhoto(i) {
    const gallery = getGallery().filter((_, j) => j !== i).map((item, j) => ({ ...item, order: j }));
    setForm((f) => ({ ...f, photoGallery: gallery, photos: gallery.map((x) => x.url) }));
  }

  function setPhotoAngle(i, angle) {
    const gallery = getGallery().map((item, j) => (j === i ? { ...item, angle } : item));
    setForm((f) => ({ ...f, photoGallery: gallery }));
  }

  function movePhoto(i, dir) {
    const gallery = [...getGallery()];
    const j = i + dir;
    if (j < 0 || j >= gallery.length) return;
    [gallery[i], gallery[j]] = [gallery[j], gallery[i]];
    gallery.forEach((item, k) => (item.order = k));
    setForm((f) => ({ ...f, photoGallery: gallery, photos: gallery.map((x) => x.url) }));
  }

  async function addVideoFromFile(file) {
    if (!file?.type?.startsWith("video/")) return;
    setVideoUploading(true);
    try {
      const url = await uploadCarVideo(file);
      setForm((f) => ({ ...f, videoUrl: url }));
      toast.success("Video uploaded");
    } catch (e) {
      toast.error(e.message || "Video upload failed");
    } finally {
      setVideoUploading(false);
    }
  }

  async function generateDescription() {
    if (!form.make?.trim() || !form.model?.trim()) {
      toast.error("Fill make and model first");
      return;
    }
    setAiLoading(true);
    try {
      const specPayload = {
        bodyType: form.bodyType || undefined,
        fuelType: form.fuelType || undefined,
        transmission: form.transmission || undefined,
      };
      const raw = (form.specs || "").trim();
      if (raw) specPayload.notes = raw;
      const { description, creditsUsed } = await ai.carDescription({
        make: form.make,
        model: form.model,
        year: form.year ? Number(form.year) : new Date().getFullYear(),
        price: form.price ? Number(form.price) : 0,
        mileage: form.mileage ? Number(form.mileage) : null,
        color: form.color || null,
        specs: Object.keys(specPayload).length ? specPayload : undefined,
      });
      setForm((f) => ({ ...f, description: description || "" }));
      toast.success(`Description generated (${creditsUsed} credit${creditsUsed !== 1 ? "s" : ""} used)`);
    } catch (e) {
      if (e.message?.includes("402") || e.message?.toLowerCase().includes("credits")) {
        toast.error("Insufficient credits to generate description");
      } else {
        toast.error(e.message || "AI description failed");
      }
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const specPayload = {
        bodyType: form.bodyType || undefined,
        fuelType: form.fuelType || undefined,
        transmission: form.transmission || undefined,
      };
      const raw = (form.specs || "").trim();
      if (raw) specPayload.notes = raw;
      const cleanedEntries = Object.entries(specPayload).filter(([, v]) => v != null && v !== "");
      const specs = cleanedEntries.length ? JSON.stringify(Object.fromEntries(cleanedEntries)) : null;

      const gallery = getGallery().map((item, i) => ({ url: item.url, angle: item.angle || null, order: i }));
      await carsApi.create({
        make: form.make,
        model: form.model,
        year: Number(form.year),
        price: Number(form.price) || 0,
        mileage: form.mileage ? Number(form.mileage) : null,
        color: form.color || null,
        specs,
        description: form.description?.trim() || null,
        photos: gallery.map((g) => g.url),
        photoGallery: gallery.length ? gallery : undefined,
        isFeaturedInTopMarquee: Boolean(form.isFeaturedInTopMarquee),
        isFeaturedInCinematicHero: Boolean(form.isFeaturedInCinematicHero),
        heroDisplayOrder: form.heroDisplayOrder !== "" ? Math.min(10, Math.max(1, Number(form.heroDisplayOrder))) : null,
        heroOverlayText: form.heroOverlayText?.trim() || null,
        discountPercentage: form.discountPercentage !== "" ? Number(form.discountPercentage) : null,
        saleEndDate: form.saleEndDate || null,
        videoUrl: form.videoUrl?.trim() || null,
        videoThumbnailUrl: form.videoThumbnailUrl?.trim() || null,
        isVideoBackground: Boolean(form.isVideoBackground),
      });
      toast.success("Car added");
      setForm({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        price: "",
        mileage: "",
        color: "",
        bodyType: "",
        fuelType: "",
        transmission: "",
        specs: "",
        description: "",
        photos: [],
        photoGallery: [],
        isFeaturedInTopMarquee: false,
        isFeaturedInCinematicHero: false,
        heroDisplayOrder: "",
        heroOverlayText: "",
        discountPercentage: "",
        saleEndDate: "",
        videoUrl: "",
        videoThumbnailUrl: "",
        isVideoBackground: false,
      });
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-navy-card rounded-2xl border border-white/10 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="font-heading font-semibold text-lg text-white mb-4">Add Car</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Make</label>
                <input
                  value={form.make}
                  onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white"
                  placeholder="e.g. Toyota"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Model</label>
                <input
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white"
                  placeholder="e.g. Fielder"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Year</label>
                <select
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white"
                  required
                >
                  {yearOptions().map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Price (KES)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mileage</label>
                <input
                  type="number"
                  value={form.mileage}
                  onChange={(e) => setForm((f) => ({ ...f, mileage: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Color</label>
                <select
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white"
                >
                  <option value="">Select</option>
                  {COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Body type</label>
                <select
                  value={form.bodyType}
                  onChange={(e) => setForm((f) => ({ ...f, bodyType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
                >
                  <option value="">Select</option>
                  {BODY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Fuel type</label>
                <select
                  value={form.fuelType}
                  onChange={(e) => setForm((f) => ({ ...f, fuelType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
                >
                  <option value="">Select</option>
                  {FUEL_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Transmission</label>
                <select
                  value={form.transmission}
                  onChange={(e) => setForm((f) => ({ ...f, transmission: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
                >
                  <option value="">Select</option>
                  {TRANSMISSIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Extra specs / notes (optional)</label>
              <textarea
                value={form.specs}
                onChange={(e) => setForm((f) => ({ ...f, specs: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white min-h-[60px]"
                placeholder='e.g. 1.5L petrol, reverse camera, alloy rims'
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description (for website listing)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white min-h-[80px]"
                placeholder="Write or generate a premium description…"
              />
              <button
                type="button"
                onClick={generateDescription}
                disabled={aiLoading || !form.make?.trim() || !form.model?.trim()}
                className="mt-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/80 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
              >
                {aiLoading ? "Generating…" : "Generate with AI (uses credits)"}
              </button>
            </div>
            <div className="border-t border-white/10 pt-4 space-y-2">
              <h3 className="text-sm font-medium text-white">Website &amp; promos</h3>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFeaturedInTopMarquee} onChange={(e) => setForm((f) => ({ ...f, isFeaturedInTopMarquee: e.target.checked }))} className="rounded border-white/20 text-accent-blue" />
                  <span className="text-sm text-gray-300">Show in Top Discount Marquee</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFeaturedInCinematicHero} onChange={(e) => setForm((f) => ({ ...f, isFeaturedInCinematicHero: e.target.checked }))} className="rounded border-white/20 text-accent-blue" />
                  <span className="text-sm text-gray-300">Show in Cinematic Hero</span>
                </label>
              </div>
              {form.isFeaturedInCinematicHero && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hero order (1–10)</label>
                    <input type="number" min={1} max={10} value={form.heroDisplayOrder} onChange={(e) => setForm((f) => ({ ...f, heroDisplayOrder: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" placeholder="1" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hero overlay text (optional)</label>
                    <input type="text" value={form.heroOverlayText} onChange={(e) => setForm((f) => ({ ...f, heroOverlayText: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" placeholder="e.g. Best Seller" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Discount % (optional)</label>
                  <input type="number" min={0} max={100} value={form.discountPercentage} onChange={(e) => setForm((f) => ({ ...f, discountPercentage: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" placeholder="e.g. 12" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Sale ends (optional)</label>
                  <input type="date" value={form.saleEndDate} onChange={(e) => setForm((f) => ({ ...f, saleEndDate: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" />
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 space-y-2">
              <h3 className="text-sm font-medium text-white">Video background (marquee / hero)</h3>
              <p className="text-xs text-gray-500">Short looped video (10–30s, MP4/WebM). Kept under 5MB for best load times.</p>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Video URL or upload</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={form.videoUrl}
                      onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
                      placeholder="https://... or upload below"
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) addVideoFromFile(f); e.target.value = ""; }}
                    />
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={videoUploading}
                      className="px-3 py-2 rounded-lg bg-navy border border-white/20 text-gray-300 text-sm hover:bg-white/10 disabled:opacity-50"
                    >
                      {videoUploading ? "Uploading…" : "Upload"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Thumbnail URL (poster frame, optional)</label>
                  <input
                    type="url"
                    value={form.videoThumbnailUrl}
                    onChange={(e) => setForm((f) => ({ ...f, videoThumbnailUrl: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
                    placeholder="https://..."
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isVideoBackground}
                    onChange={(e) => setForm((f) => ({ ...f, isVideoBackground: e.target.checked }))}
                    className="rounded border-white/20 text-accent-blue"
                  />
                  <span className="text-sm text-gray-300">Use video as marquee / hero background</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Photo gallery</label>
              <p className="text-xs text-gray-500 mb-2">First photo = hero/thumbnail. Add angle labels for the website.</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getGallery().map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-navy border border-white/10">
                    <div className="relative w-14 h-14 rounded overflow-hidden bg-navy-light shrink-0">
                      <img src={item.url} alt="" className="w-full h-full object-cover" onError={(e) => e.target.style.display = "none"} />
                      {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-center text-white py-0.5">Hero</span>}
                    </div>
                    <select value={item.angle || ""} onChange={(e) => setPhotoAngle(i, e.target.value)} className="flex-1 min-w-0 px-2 py-1.5 rounded bg-navy border border-white/10 text-white text-xs">
                      {PHOTO_ANGLES.map((a) => (
                        <option key={a || "none"} value={a}>{a || "— Angle —"}</option>
                      ))}
                    </select>
                    <div className="flex flex-col gap-0.5">
                      <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0} className="w-6 h-5 rounded bg-white/10 text-white text-xs disabled:opacity-40">↑</button>
                      <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === getGallery().length - 1} className="w-6 h-5 rounded bg-white/10 text-white text-xs disabled:opacity-40">↓</button>
                    </div>
                    <button type="button" onClick={() => removePhoto(i)} className="w-7 h-7 rounded bg-red-500/80 text-white text-sm shrink-0">×</button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addPhotosFromFiles(e.target.files); e.target.value = ""; }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-14 h-14 rounded border border-dashed border-white/20 text-gray-500 hover:border-accent-blue hover:text-accent-blue flex items-center justify-center text-xl">+</button>
                <button type="button" onClick={addPhotoUrl} className="w-14 h-14 rounded border border-dashed border-white/20 text-gray-500 hover:border-white/40 flex items-center justify-center text-xs">URL</button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-accent-blue text-white font-medium disabled:opacity-50">
                {loading ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-white/20 text-gray-400 hover:text-white">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
