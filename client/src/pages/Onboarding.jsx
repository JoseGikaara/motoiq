import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { onboarding, settings, cars } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState({ dealershipName: "", phone: "", city: "", tagline: "", logoUrl: "" });
  const [carForm, setCarForm] = useState({
    make: "Toyota",
    model: "RAV4",
    year: "2018",
    price: "2450000",
    mileage: "65000",
    photos: [],
  });
  const [addedCarId, setAddedCarId] = useState(null);
  const [shareLink, setShareLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [websiteSlug, setWebsiteSlug] = useState("");
  const [websiteActive, setWebsiteActive] = useState(false);
  const [ensuringWebsite, setEnsuringWebsite] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    onboarding
      .steps()
      .then((s) => {
        setSteps(s);
        const by = Object.fromEntries(s.map((x) => [x.step, x.completed]));
        // Map backend 4 steps -> 5-step UI
        if (!by.profile) setCurrentStep(1);
        else if (!by.first_car) setCurrentStep(2);
        else if (!by.share_link) setCurrentStep(3);
        else if (!by.complete) setCurrentStep(5);
        else setCurrentStep(5);
      })
      .catch(() => setSteps([]));

    settings
      .get()
      .then((d) => {
        setProfile({
          dealershipName: d.dealershipName || "",
          phone: d.phone || "",
          city: d.city || "",
          tagline: d.tagline || "",
          logoUrl: d.logoUrl || "",
        });
        setWebsiteSlug(d.websiteSlug || "");
        setWebsiteActive(Boolean(d.websiteActive));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (currentStep === 5) {
      setShowConfetti(true);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 3 && !websiteActive && !ensuringWebsite) {
      setEnsuringWebsite(true);
      settings
        .update({ websiteActive: true })
        .then((d) => {
          setWebsiteActive(Boolean(d.websiteActive));
          setWebsiteSlug(d.websiteSlug || "");
        })
        .catch(() => {})
        .finally(() => setEnsuringWebsite(false));
    }
  }, [currentStep, websiteActive, ensuringWebsite]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await settings.update(profile);
      await onboarding.completeStep("profile");
      setSteps((s) => s.map((x, i) => (i === 0 ? { ...x, completed: true } : x)));
      setCurrentStep(2);
    } catch (err) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const car = await cars.create({
        make: carForm.make,
        model: carForm.model,
        year: Number(carForm.year),
        price: Number(carForm.price),
        mileage: carForm.mileage ? Number(carForm.mileage) : undefined,
        photos: Array.isArray(carForm.photos) ? carForm.photos : [],
      });
      setAddedCarId(car.id);
      await onboarding.completeStep("first_car");
      const base = window.location.origin;
      setShareLink(`${base}/car/${car.id}`);
      setCurrentStep(3);
    } catch (err) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipCar = async () => {
    setError("");
    setLoading(true);
    try {
      await onboarding.completeStep("first_car");
      setShareLink(`${window.location.origin}/showroom/${user?.id || ""}`);
      setCurrentStep(3);
    } catch (_) {}
    setLoading(false);
  };

  const handleShareLinkComplete = async () => {
    setError("");
    setLoading(true);
    try {
      await onboarding.completeStep("share_link");
      setCurrentStep(4);
    } catch (err) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError("");
    try {
      await onboarding.completeStep("complete");
      updateUser({ onboardingComplete: true });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Failed to complete");
    } finally {
      setLoading(false);
    }
  };

  const stepNum = currentStep;
  const websitePreviewUrl =
    websiteSlug && typeof window !== "undefined" ? `${window.location.origin}/s/${encodeURIComponent(websiteSlug)}` : "";

  return (
    <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden">
      {showConfetti && typeof window !== "undefined" && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={260}
          recycle={false}
        />
      )}
      <div className="border-b border-slate-700 py-3 px-6 text-sm text-slate-400 flex items-center justify-between">
        <span>Step {stepNum} of 5</span>
        <span className="text-slate-500">Welcome, {user?.name || "dealer"}</span>
      </div>
      <div className="max-w-lg mx-auto px-6 py-8">
        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{error}</div>}

        <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="flex items-center gap-1">
              <div
                className={[
                  "w-6 h-6 rounded-full flex items-center justify-center border text-[11px]",
                  n < stepNum ? "bg-green-500 border-green-400 text-slate-900" : n === stepNum ? "bg-blue-600 border-blue-400" : "border-slate-600",
                ].join(" ")}
              >
                {n < stepNum ? "✓" : n}
              </div>
              {n < 5 && <div className="w-5 h-px bg-slate-700" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {stepNum === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-2xl font-bold mb-2">Complete your profile</h1>
              <p className="text-slate-400 mb-6">
                Tell buyers who you are. This powers your hosted website and lead pages.
              </p>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <input
                  type="text"
                  placeholder="Dealership name"
                  value={profile.dealershipName}
                  onChange={(e) => setProfile((p) => ({ ...p, dealershipName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={profile.city}
                  onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white"
                />
                <input
                  type="text"
                  placeholder="Tagline (e.g. Premium cars for Kenyan roads)"
                  value={profile.tagline}
                  onChange={(e) => setProfile((p) => ({ ...p, tagline: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white"
                />
                <input
                  type="url"
                  placeholder="Logo URL"
                  value={profile.logoUrl}
                  onChange={(e) => setProfile((p) => ({ ...p, logoUrl: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50"
                >
                  {loading ? "Saving…" : "Save & continue →"}
                </button>
              </form>
            </motion.div>
          )}

          {stepNum === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-xl font-bold mb-2">Add your first car</h1>
              <p className="text-slate-400 mb-4">
                We’ve pre-filled an example. Tweak it or replace with a real car — this becomes your first live page.
              </p>
              <div className="mb-4 rounded-xl border border-blue-500/40 bg-blue-900/20 p-3 text-xs text-blue-100">
                <p className="font-medium mb-1">Example:</p>
                <p>
                  Toyota RAV4 · 2018 · KES 2,450,000 · 65,000km — perfect Nairobi family SUV.
                </p>
              </div>
              <form onSubmit={handleAddCar} className="space-y-4">
                <input
                  type="text"
                  placeholder="Make *"
                  value={carForm.make}
                  onChange={(e) => setCarForm((c) => ({ ...c, make: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Model *"
                  value={carForm.model}
                  onChange={(e) => setCarForm((c) => ({ ...c, model: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white"
                  required
                />
                <input
                  type="number"
                  placeholder="Year *"
                  value={carForm.year}
                  onChange={(e) => setCarForm((c) => ({ ...c, year: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white"
                  required
                />
                <input
                  type="number"
                  placeholder="Price (KES) *"
                  value={carForm.price}
                  onChange={(e) => setCarForm((c) => ({ ...c, price: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white"
                  required
                />
                <input
                  type="number"
                  placeholder="Mileage (optional)"
                  value={carForm.mileage}
                  onChange={(e) => setCarForm((c) => ({ ...c, mileage: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold text-base disabled:opacity-50"
                >
                  {loading ? "Adding car…" : "Add car & continue →"}
                </button>
              </form>
              <button
                type="button"
                onClick={handleSkipCar}
                disabled={loading}
                className="w-full mt-4 py-2 text-slate-400 hover:text-white text-sm"
              >
                I’ll add cars later →
              </button>
            </motion.div>
          )}

          {stepNum === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-xl font-bold mb-2">Your website is live!</h1>
              <p className="text-slate-400 mb-4">
                This is your hosted MotorIQ website — what buyers will see when they click your links.
              </p>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 overflow-hidden mb-4">
                <div className="px-3 py-2 flex items-center justify-between text-xs text-slate-400 bg-slate-900/80 border-b border-slate-800">
                  <span>Live preview</span>
                  <span className="font-mono text-[11px] truncate max-w-[60%]">
                    {websiteSlug ? `https://${websiteSlug}.motoriq.co.ke` : "Generating your subdomain…"}
                  </span>
                </div>
                <div className="h-64 bg-black">
                  {websitePreviewUrl ? (
                    <iframe
                      key={websitePreviewUrl}
                      src={websitePreviewUrl}
                      title="Website preview"
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                      {ensuringWebsite ? "Activating your website…" : "Website will be activated in a moment."}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={!websiteSlug}
                  onClick={() => {
                    if (!websiteSlug || typeof window === "undefined") return;
                    const url = `${window.location.origin}/s/${encodeURIComponent(websiteSlug)}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  className="w-full py-3 rounded-lg bg-slate-100 text-slate-900 font-medium disabled:opacity-50"
                >
                  View My Website ↗
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium"
                >
                  Next: Share with my first lead →
                </button>
              </div>
            </motion.div>
          )}

          {stepNum === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-xl font-bold mb-2">Share with your first lead</h1>
              <p className="text-slate-400 mb-4">
                Copy this link and post it on Facebook, Instagram or WhatsApp to start capturing real leads.
              </p>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => shareLink && navigator.clipboard.writeText(shareLink)}
                  className="px-4 py-3 rounded-lg bg-slate-700 text-white text-sm"
                >
                  Copy
                </button>
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent("Check out this car: " + shareLink)}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full py-3 rounded-lg bg-green-600 text-white text-center font-medium mb-2"
              >
                Share on WhatsApp
              </a>
              <a
                href={shareLink}
                target="_blank"
                rel="noreferrer"
                className="block w-full py-3 rounded-lg border border-slate-600 text-center mb-4"
              >
                Open my page ↗
              </a>
              <button
                onClick={handleShareLinkComplete}
                className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium"
              >
                Continue →
              </button>
            </motion.div>
          )}

          {stepNum === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="text-center"
            >
              <h1 className="text-2xl font-bold mb-2">You’re ready to sell.</h1>
              <p className="text-slate-400 mb-6">
                Your dashboard, lead capture, and hosted website are live. Next step: share your links and follow up daily.
              </p>
              <div className="space-y-4 text-left mb-8">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  Share your car links on Facebook, Instagram and WhatsApp.
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  Check your leads dashboard daily and call the hottest leads first.
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  Use AI scoring and follow-ups to recover revenue you’d normally lose.
                </div>
              </div>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50"
              >
                Go to my dashboard →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
