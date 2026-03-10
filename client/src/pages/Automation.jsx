import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { dripSequences } from "../api";

const CHANNELS = ["SMS", "WHATSAPP", "EMAIL"];

export default function Automation() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: true,
    steps: [{ order: 1, triggerAfterDays: 1, channel: "SMS", templateText: "Hi {leadName}, thanks for your interest in {carModel}. We're here to help!", useAI: false }],
  });

  useEffect(() => {
    dripSequences.list().then(setSequences).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Sequence name required");
      return;
    }
    try {
      if (editing) {
        await dripSequences.update(editing.id, form);
        toast.success("Sequence updated");
      } else {
        await dripSequences.create(form);
        toast.success("Sequence created");
      }
      setEditing(null);
      setForm({ name: "", description: "", isActive: true, steps: [{ order: 1, triggerAfterDays: 1, channel: "SMS", templateText: "Hi {leadName}, thanks for your interest in {carModel}.", useAI: false }] });
      dripSequences.list().then(setSequences);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const addStep = () => {
    setForm((f) => ({
      ...f,
      steps: [...f.steps, { order: f.steps.length + 1, triggerAfterDays: 1, channel: "SMS", templateText: "", useAI: false }],
    }));
  };

  const removeStep = (idx) => {
    setForm((f) => ({
      ...f,
      steps: f.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })),
    }));
  };

  const updateStep = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      steps: f.steps.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  };

  const startEdit = (seq) => {
    setEditing(seq);
    setForm({
      name: seq.name,
      description: seq.description || "",
      isActive: seq.isActive,
      steps: (seq.steps || []).length ? seq.steps.map((s) => ({ order: s.order, triggerAfterDays: s.triggerAfterDays, channel: s.channel, templateText: s.templateText, useAI: s.useAI })) : [{ order: 1, triggerAfterDays: 1, channel: "SMS", templateText: "", useAI: false }],
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this sequence? Enrolled leads will stop receiving new steps.")) return;
    try {
      await dripSequences.delete(id);
      toast.success("Sequence deleted");
      setSequences((prev) => prev.filter((s) => s.id !== id));
      if (editing && editing.id === id) setEditing(null);
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Automation</h1>
        <p className="text-gray-400 mt-0.5">Drip sequences to nurture leads automatically</p>
      </div>

      <div className="bg-navy-card rounded-xl border border-white/5 p-5">
        <h2 className="font-heading font-semibold text-white mb-3">{editing ? "Edit sequence" : "New sequence"}</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white"
              placeholder="e.g. New Lead Welcome"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white"
              placeholder="When to use this sequence"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-white/20"
            />
            <label htmlFor="isActive" className="text-sm text-gray-300">Active (new enrollments can use this)</label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                Steps (placeholders: leadName, carModel, price, lastInteraction)
              </span>
              <button type="button" onClick={addStep} className="text-sm text-accent-blue hover:underline">+ Add step</button>
            </div>
            <div className="space-y-3">
              {form.steps.map((step, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-navy border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Step {idx + 1}</span>
                    {form.steps.length > 1 && (
                      <button type="button" onClick={() => removeStep(idx)} className="text-xs text-red-400 hover:underline">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500">Delay (days)</label>
                      <input
                        type="number"
                        min={0}
                        value={step.triggerAfterDays}
                        onChange={(e) => updateStep(idx, "triggerAfterDays", Number(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded bg-navy border border-white/10 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Channel</label>
                      <select
                        value={step.channel}
                        onChange={(e) => updateStep(idx, "channel", e.target.value)}
                        className="w-full px-2 py-1.5 rounded bg-navy border border-white/10 text-white text-sm"
                      >
                        {CHANNELS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Message template</label>
                    <textarea
                      value={step.templateText}
                      onChange={(e) => updateStep(idx, "templateText", e.target.value)}
                      className="w-full px-2 py-1.5 rounded bg-navy border border-white/10 text-white text-sm min-h-[60px]"
                      placeholder="Hi {leadName}, …"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`useAI-${idx}`}
                      checked={step.useAI}
                      onChange={(e) => updateStep(idx, "useAI", e.target.checked)}
                      className="rounded border-white/20"
                    />
                    <label htmlFor={`useAI-${idx}`} className="text-xs text-gray-400">Use AI to personalize (uses credits)</label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-accent-blue text-white font-medium">
              {editing ? "Update" : "Create"} sequence
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm({
                    name: "",
                    description: "",
                    isActive: true,
                    steps: [
                      {
                        order: 1,
                        triggerAfterDays: 1,
                        channel: "SMS",
                        templateText: "",
                        useAI: false,
                      },
                    ],
                  });
                }}
                className="px-4 py-2 rounded-lg bg-white/10 text-gray-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h2 className="font-heading font-semibold text-white mb-3">Your sequences</h2>
        {loading ? (
          <div className="h-24 bg-navy-card rounded-xl animate-pulse" />
        ) : sequences.length === 0 ? (
          <p className="text-gray-500 text-sm">No sequences yet. Create one above.</p>
        ) : (
          <div className="space-y-2">
            {sequences.map((seq) => (
              <div key={seq.id} className="flex items-center justify-between p-4 rounded-xl bg-navy-card border border-white/5">
                <div>
                  <p className="font-medium text-white">{seq.name}</p>
                  {seq.description && <p className="text-sm text-gray-400">{seq.description}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    {(seq.steps && seq.steps.length) ? seq.steps.length : 0} steps · {seq.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(seq)} className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-gray-200 hover:bg-white/20">Edit</button>
                  <button onClick={() => handleDelete(seq.id)} className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
