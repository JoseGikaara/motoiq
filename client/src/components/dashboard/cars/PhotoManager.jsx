import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { cars as carsApi, uploadCarImage } from "../../../api";
import { X, Star, Trash2, ChevronUp, ChevronDown } from "lucide-react";

const ANGLES = [
  "FRONT", "FRONT_LEFT", "FRONT_RIGHT", "REAR", "REAR_LEFT", "REAR_RIGHT",
  "LEFT_SIDE", "RIGHT_SIDE", "INTERIOR_DASH", "INTERIOR_SEATS", "INTERIOR_BACKSEATS",
  "INTERIOR_CARGO", "INTERIOR_DETAILS", "ENGINE", "WHEELS", "TRUNK", "ROOF",
  "UNDERNEATH", "DETAIL_SHOT", "OTHER",
];

function angleLabel(a) {
  return a.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PhotoManager({ open, onClose, car }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (!open || !car?.id) return;
    setLoading(true);
    carsApi
      .listPhotos(car.id)
      .then(setPhotos)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [open, car?.id]);

  async function handleAddFiles(files) {
    if (!car?.id || !files?.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadCarImage(file);
        urls.push({ url, angle: "OTHER", displayOrder: photos.length + urls.length });
      }
      if (urls.length === 0) {
        toast.error("No valid image files");
        setUploading(false);
        return;
      }
      const created = await carsApi.addPhotos(car.id, urls);
      setPhotos((prev) => [...prev, ...created].sort((a, b) => a.displayOrder - b.displayOrder));
      toast.success(`${created.length} photo(s) added`);
    } catch (e) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function setPrimary(photoId) {
    if (!car?.id || saving) return;
    setSaving(photoId);
    try {
      await carsApi.updatePhoto(car.id, photoId, { isPrimary: true });
      setPhotos((prev) =>
        prev.map((p) => ({ ...p, isPrimary: p.id === photoId }))
      );
      toast.success("Primary photo updated");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  }

  async function updateAngle(photoId, angle) {
    if (!car?.id || saving) return;
    setSaving(photoId);
    try {
      const updated = await carsApi.updatePhoto(car.id, photoId, { angle });
      setPhotos((prev) => prev.map((p) => (p.id === photoId ? updated : p)));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  }

  async function remove(photoId) {
    if (!car?.id || !confirm("Remove this photo?")) return;
    try {
      await carsApi.deletePhoto(car.id, photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast.success("Photo removed");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function move(index, delta) {
    const newOrder = [...photos];
    const j = index + delta;
    if (j < 0 || j >= newOrder.length) return;
    [newOrder[index], newOrder[j]] = [newOrder[j], newOrder[index]];
    const order = newOrder.map((p, i) => ({ id: p.id, displayOrder: i }));
    try {
      const updated = await carsApi.reorderPhotos(car.id, order);
      setPhotos(updated);
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (!open) return null;

  const title = car ? `${car.year} ${car.make} ${car.model} — Photos` : "Manage photos";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-navy-card rounded-xl border border-white/10 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-heading font-semibold text-lg text-white">{title}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10 flex flex-wrap gap-3 items-center">
          <label className="px-3 py-2 rounded-lg bg-accent-blue text-white text-sm font-medium cursor-pointer hover:bg-accent-blue/90 disabled:opacity-50">
            {uploading ? "Uploading…" : "Add photos"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                handleAddFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <span className="text-xs text-gray-500">Upload then assign angle below. First photo is primary by default.</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-video rounded-lg bg-navy animate-pulse" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No photos yet. Add photos above or use the main car form to add images.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative group rounded-lg overflow-hidden border border-white/10 bg-navy-light"
                >
                  <img
                    src={photo.thumbnailUrl || photo.optimizedUrl || photo.url}
                    alt={photo.title || angleLabel(photo.angle)}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute top-1 left-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setPrimary(photo.id)}
                      disabled={saving === photo.id}
                      className={`p-1 rounded ${photo.isPrimary ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400 bg-black/50"}`}
                      title="Set as primary"
                    >
                      <Star className={`w-4 h-4 ${photo.isPrimary ? "fill-current" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className="p-1 rounded bg-black/50 text-white disabled:opacity-30"
                      title="Move left"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === photos.length - 1}
                      className="p-1 rounded bg-black/50 text-white disabled:opacity-30"
                      title="Move right"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex flex-wrap gap-1 items-center">
                    <select
                      value={photo.angle}
                      onChange={(e) => updateAngle(photo.id, e.target.value)}
                      disabled={saving === photo.id}
                      className="text-xs rounded bg-black/60 text-white border border-white/20 py-1 px-2 max-w-full"
                    >
                      {ANGLES.map((a) => (
                        <option key={a} value={a}>{angleLabel(a)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => remove(photo.id)}
                      className="p-1 rounded text-red-400 hover:bg-red-500/20 ml-auto"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {photo.isPrimary && (
                    <span className="absolute top-1 right-1 text-[10px] font-medium bg-accent-blue text-white px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
