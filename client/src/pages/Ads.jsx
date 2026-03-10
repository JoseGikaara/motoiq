import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { cars as carsApi, ai } from "../api";

export default function Ads() {
  const [carList, setCarList] = useState([]);
  const [carId, setCarId] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    carsApi.list().then(setCarList).catch(() => {});
  }, []);

  async function handleGenerate() {
    if (!carId) {
      toast.error("Select a car");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await ai.adCopy({ carId, targetAudience: targetAudience || undefined, location: location || undefined });
      setResult(data);
      toast.success("Ad copy generated");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function copyText(text) {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Ad Copy Generator</h1>
        <p className="text-gray-400 mt-0.5">Generate headlines, descriptions and captions for social ads</p>
      </div>

      <div className="bg-navy-card rounded-xl border border-white/5 p-6 shadow-card max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Select car</label>
            <select value={carId} onChange={(e) => setCarId(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white">
              <option value="">Choose a car</option>
              {carList.map((c) => (
                <option key={c.id} value={c.id}>{c.make} {c.model} ({c.year})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Target audience</label>
            <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g. Young professionals" className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Nairobi" className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500" />
          </div>
          <button onClick={handleGenerate} disabled={loading} className="px-4 py-2.5 rounded-lg bg-accent-blue text-white font-medium hover:bg-accent-blue/90 disabled:opacity-50">
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
            <h3 className="font-heading font-semibold text-white mb-3">Headlines</h3>
            <ul className="space-y-2">
              {(result.headlines || []).map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-sm text-gray-300 flex-1">{h}</span>
                  <button onClick={() => copyText(h)} className="text-xs text-accent-blue hover:underline shrink-0">Copy</button>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
            <h3 className="font-heading font-semibold text-white mb-3">Descriptions</h3>
            <ul className="space-y-2">
              {(result.descriptions || []).map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-sm text-gray-300 flex-1">{d}</span>
                  <button onClick={() => copyText(d)} className="text-xs text-accent-blue hover:underline shrink-0">Copy</button>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-navy-card rounded-xl border border-white/5 p-5 shadow-card">
            <h3 className="font-heading font-semibold text-white mb-3">Captions</h3>
            <ul className="space-y-2">
              {(result.captions || []).map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-sm text-gray-300 flex-1">{c}</span>
                  <button onClick={() => copyText(c)} className="text-xs text-accent-blue hover:underline shrink-0">Copy</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="bg-navy-card rounded-xl border border-white/5 p-12 text-center max-w-2xl">
          <p className="text-gray-400">Select a car and click Generate to get 3 headlines, 3 descriptions and 3 captions.</p>
        </div>
      )}
    </div>
  );
}
