import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { banners as bannersApi, settings as settingsApi } from "../api";

const BANNER_TYPES = [
  { value: "ROTATING", label: "Rotating" },
  { value: "FLASH_SALE", label: "Flash Sale" },
  { value: "HEADLINE", label: "Headline" },
];
const TARGETS = [
  { value: "NONE", label: "None" },
  { value: "INVENTORY", label: "Inventory" },
  { value: "FINANCING", label: "Financing" },
  { value: "CONTACT", label: "Contact" },
  { value: "CUSTOM_URL", label: "Custom URL" },
];

const emptyForm = () => ({
  type: "ROTATING",
  title: "",
  description: "",
  imageUrl: "",
  ctaText: "",
  ctaTarget: "NONE",
  ctaUrl: "",
  startDate: new Date().toISOString().slice(0, 16),
  endDate: "",
  isActive: true,
  displayOrder: 0,
  backgroundColor: "",
  textColor: "",
});

export default function Banners() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([bannersApi.list(), settingsApi.get()])
      .then(([banners, settings]) => {
        setList(banners || []);
        setSlug(settings.websiteSlug || "");
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title?.trim()) {
      toast.error("Title required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        imageUrl: form.imageUrl?.trim() || null,
        ctaText: form.ctaText?.trim() || null,
        ctaTarget: form.ctaTarget,
        ctaUrl: form.ctaTarget === "CUSTOM_URL" ? form.ctaUrl?.trim() : null,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        isActive: form.isActive,
        displayOrder: Number(form.displayOrder) || 0,
        backgroundColor: form.backgroundColor?.trim() || null,
        textColor: form.textColor?.trim() || null,
      };
      if (editingId) {
        await bannersApi.update(editingId, payload);
        toast.success("Banner updated");
      } else {
        await bannersApi.create(payload);
        toast.success("Banner created");
      }
      setList(await bannersApi.list());
      setEditingId(null);
      setForm(emptyForm());
    } catch (e) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this banner?")) return;
    try {
      await bannersApi.delete(id);
      toast.success("Banner deleted");
      setList((prev) => prev.filter((b) => b.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm());
      }
    } catch (e) {
      toast.error(e.message);
    }
  }

  function startEdit(banner) {
    setEditingId(banner.id);
    setForm({
      type: banner.type,
      title: banner.title,
      description: banner.description || "",
      imageUrl: banner.imageUrl || "",
      ctaText: banner.ctaText || "",
      ctaTarget: banner.ctaTarget || "NONE",
      ctaUrl: banner.ctaUrl || "",
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().slice(0, 16) : "",
      isActive: banner.isActive !== false,
      displayOrder: banner.displayOrder ?? 0,
      backgroundColor: banner.backgroundColor || "",
      textColor: banner.textColor || "",
    });
  }

  const rotatingCount = list.filter((b) => b.type === "ROTATING" && b.isActive).length;
  const maxRotating = 5;

  if (loading) return <div className="h-64 bg-navy-card rounded-xl animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Banners</h1>
          <p className="text-gray-400 mt-0.5">Promotional banners on your website (below header, above hero). Max 5 active rotating.</p>
        </div>
        {slug && (
          <Link
            to={`/s/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent-blue hover:underline"
          >
            View website →
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-navy-card rounded-xl border border-white/5 p-6 shadow-card space-y-4 max-w-2xl">
        <h2 className="font-heading font-semibold text-lg text-white">{editingId ? "Edit banner" : "Add banner"}</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Type</label>
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white">
            {BANNER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Title *</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" required />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
          <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="Subtitle or short text" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Background image URL (optional)</label>
          <input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white" placeholder="https://..." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Background color (hex, fallback)</label>
            <div className="flex gap-2">
              <input type="color" value={form.backgroundColor || "#2563EB"} onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer" />
              <input value={form.backgroundColor} onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))} className="flex-1 px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" placeholder="#2563EB" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Text color (hex)</label>
            <div className="flex gap-2">
              <input type="color" value={form.textColor || "#FFFFFF"} onChange={(e) => setForm((f) => ({ ...f, textColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer" />
              <input value={form.textColor} onChange={(e) => setForm((f) => ({ ...f, textColor: e.target.value }))} className="flex-1 px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" placeholder="#FFFFFF" />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Call to action</label>
          <div className="flex flex-wrap gap-3 items-end">
            <select value={form.ctaTarget} onChange={(e) => setForm((f) => ({ ...f, ctaTarget: e.target.value }))} className="px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm">
              {TARGETS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input value={form.ctaText} onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))} className="px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm w-40" placeholder="Button text" />
            {form.ctaTarget === "CUSTOM_URL" && (
              <input value={form.ctaUrl} onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))} className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" placeholder="https://..." required />
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Start date</label>
            <input type="datetime-local" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">End date (optional, required for Flash Sale)</label>
            <input type="datetime-local" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <input type="number" min={0} value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))} className="w-20 px-2 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm" />
            <label className="text-sm text-gray-400">Display order (lower = first)</label>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded border-white/20 text-accent-blue" />
            <span className="text-sm text-gray-400">Active</span>
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-accent-blue text-white font-medium hover:bg-accent-blue/90 disabled:opacity-50">
            {saving ? "Saving…" : editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm()); }} className="px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:text-white">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        <h2 className="font-heading font-semibold text-lg text-white">Active banners ({list.length})</h2>
        {form.type === "ROTATING" && !editingId && rotatingCount >= maxRotating && (
          <p className="text-amber-400 text-sm">You have {maxRotating} active rotating banners. Deactivate one to add another.</p>
        )}
        {list.length === 0 ? (
          <p className="text-gray-400 text-sm">No banners yet. Create one above.</p>
        ) : (
          <ul className="space-y-2">
            {list.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-navy-card border border-white/5">
                <div>
                  <span className="text-xs text-gray-500 uppercase">{b.type}</span>
                  <p className="font-medium text-white">{b.title}</p>
                  {b.description && <p className="text-sm text-gray-400">{b.description}</p>}
                  <p className="text-xs text-gray-500 mt-1">Order: {b.displayOrder} · {b.isActive ? "Active" : "Inactive"}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEdit(b)} className="px-3 py-1.5 rounded-lg border border-white/20 text-sm text-gray-300 hover:text-white">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(b.id)} className="px-3 py-1.5 rounded-lg border border-red-500/50 text-sm text-red-400 hover:bg-red-500/10">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
