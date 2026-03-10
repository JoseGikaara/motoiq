import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "motoriq_onboarded";
const STEP_KEY = "motoriq_onboarding_step";

export default function OnboardingOverlay({ dealerId, carCount, onComplete }) {
  const getStep = () => {
    const s = parseInt(localStorage.getItem(STEP_KEY) || "1", 10);
    if (carCount === 0 && s > 1) return 1;
    return s;
  };
  const [step, setStep] = useState(getStep());

  useEffect(() => {
    if (carCount > 0 && step === 1) {
      setStep(2);
      localStorage.setItem(STEP_KEY, "2");
    }
  }, [carCount, step]);
  const showroomUrl = typeof window !== "undefined" ? `${window.location.origin}/showroom/${dealerId}` : "";

  const skip = () => {
    localStorage.setItem(STORAGE_KEY + "_" + dealerId, "1");
    localStorage.removeItem(STEP_KEY);
    onComplete?.();
  };

  const next = () => {
    if (step < 4) {
      const n = step + 1;
      setStep(n);
      localStorage.setItem(STEP_KEY, String(n));
    } else {
      localStorage.setItem(STORAGE_KEY + "_" + dealerId, "1");
      localStorage.removeItem(STEP_KEY);
      onComplete?.();
    }
  };

  const copyLink = () => {
    if (showroomUrl) {
      navigator.clipboard.writeText(showroomUrl);
      next();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy/95 flex items-center justify-center p-4">
      <div className="bg-navy-card rounded-2xl border border-white/10 shadow-xl max-w-lg w-full p-6">
        {step === 1 && (
          <>
            <h2 className="font-heading font-bold text-xl text-white mb-2">Welcome to MotorIQ!</h2>
            <p className="text-gray-400 mb-4">Let's get your first car listed.</p>
            <div className="flex gap-2">
              <Link to="/cars" className="flex-1 py-2.5 rounded-lg bg-accent-blue text-white font-medium text-center">Add car</Link>
              <button type="button" onClick={skip} className="px-4 py-2.5 rounded-lg border border-white/20 text-gray-400 text-sm">Skip for now</button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="font-heading font-bold text-xl text-white mb-2">Your car is live!</h2>
            <p className="text-gray-400 mb-2">Share your showroom link:</p>
            <p className="font-mono text-sm text-accent-blue break-all mb-4">{showroomUrl}</p>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={copyLink} className="px-4 py-2.5 rounded-lg bg-accent-blue text-white font-medium">Copy link</button>
              <a href={`https://wa.me/?text=${encodeURIComponent("Check out our cars: " + showroomUrl)}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-lg bg-green-600 text-white font-medium">Share on WhatsApp</a>
              <button type="button" onClick={skip} className="px-4 py-2.5 text-gray-400 text-sm">Skip</button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="font-heading font-bold text-xl text-white mb-2">Complete your profile</h2>
            <p className="text-gray-400 mb-4">Add your dealership name, phone and city so buyers trust you.</p>
            <div className="flex gap-2">
              <Link to="/settings" className="flex-1 py-2.5 rounded-lg bg-accent-blue text-white font-medium text-center" onClick={next}>Go to Settings</Link>
              <button type="button" onClick={skip} className="px-4 py-2.5 rounded-lg border border-white/20 text-gray-400 text-sm">Skip</button>
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <h2 className="font-heading font-bold text-xl text-white mb-2">You're ready!</h2>
            <p className="text-gray-400 mb-4">What to do next:</p>
            <ul className="text-sm text-gray-300 space-y-2 mb-4">
              <li>• Share your car links on Facebook and WhatsApp</li>
              <li>• Check Leads daily and follow up with hot leads</li>
              <li>• Use the Ad Copy generator for social posts</li>
            </ul>
            <button type="button" onClick={next} className="w-full py-2.5 rounded-lg bg-accent-blue text-white font-medium">Get started</button>
          </>
        )}
      </div>
    </div>
  );
}
