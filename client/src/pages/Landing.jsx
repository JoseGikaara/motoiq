import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { leads } from "../api";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    dealershipName: "",
    email: "",
    phone: "",
    city: "",
    inventorySize: "",
  });

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navScrolled = scrollY > 50;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.dealershipName || !form.email || !form.phone || !form.city) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await leads.createInterestedDealer({
        name: form.name,
        dealershipName: form.dealershipName,
        email: form.email,
        phone: form.phone,
        city: form.city,
        inventorySize: form.inventorySize,
      });
      toast.success("Thanks, we'll be in touch shortly.");
      setForm({
        name: "",
        dealershipName: "",
        email: "",
        phone: "",
        city: "",
        inventorySize: "",
      });
      setFormOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to submit interest");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <nav className={`sticky top-0 z-40 flex items-center justify-between px-6 py-4 transition-all ${navScrolled ? "bg-slate-900/90 backdrop-blur border-b border-slate-700" : ""}`}>
        <Link to="/" className="flex items-center gap-2 font-bold text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>
          <span>
            Motor<span className="text-blue-400">IQ</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-slate-300 text-sm">
          <a href="#features" className="hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-white">
            How It Works
          </a>
          <a href="#offer" className="hover:text-white">
            Offer
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800">
            Login
          </Link>
          <Link to="/demo" className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 font-medium hover:bg-white">
            View Demo
          </Link>
          <button
            type="button"
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[64px] z-30 bg-slate-900/95 p-6 flex flex-col gap-4">
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>
            Features
          </a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
            How It Works
          </a>
          <a href="#offer" onClick={() => setMobileMenuOpen(false)}>
            Offer
          </a>
          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
            Login
          </Link>
          <Link to="/demo" onClick={() => setMobileMenuOpen(false)} className="text-blue-400">
            View Demo
          </Link>
        </div>
      )}

      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_50%_50%,#1e3a5f,transparent)]" />
        <div className="relative z-10 text-center max-w-3xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-slate-800 text-slate-300 text-sm mb-4">
            🇰🇪 Built for Kenyan car dealers
          </span>
          <h1
            className="text-4xl md:text-6xl font-extrabold leading-tight mb-4"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Turn browsers into buyers
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            AI-powered sales engine for car dealers. Capture every lead, score it automatically, and follow up with AI-written
            messages — all from one dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/demo"
              className="px-8 py-4 rounded-xl bg-slate-100 text-slate-900 font-semibold hover:bg-white"
            >
              View Demo
            </Link>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500"
            >
              I'm Interested
            </button>
          </div>
          <p className="text-slate-500 text-sm mt-6">Done-for-you setup. No tech skills needed.</p>
        </div>
      </section>

      {/* Feature highlights */}
      <section id="features" className="py-20 px-6 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-bold text-center mb-10"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Everything your dealership needs in one place
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Car inventory management",
              "Public car showroom website",
              "Lead capture forms",
              "Kanban sales pipeline",
              "AI lead scoring",
              "AI follow-up messages",
              "AI ad copy generation",
              "Sales analytics dashboard",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex gap-3 items-start"
              >
                <span className="mt-0.5 text-blue-400">✓</span>
                <p className="text-slate-200 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 bg-slate-900/70">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            How MotorIQ works
          </h2>
          <p className="text-slate-400 mb-10">
            A simple, done-for-you process. We set everything up — you just log in and start closing deals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left md:text-center">
            {[
              {
                step: 1,
                title: "Dealer expresses interest",
                desc: "You submit the interest form so our team can review your dealership.",
              },
              {
                step: 2,
                title: "Admin sets up everything",
                desc: "We configure your website, pipeline, automations, and AI credits for you.",
              },
              {
                step: 3,
                title: "Dealer receives login",
                desc: "You get your dashboard URL, email, and temporary password via email.",
              },
              {
                step: 4,
                title: "Leads start coming in",
                desc: "Your website goes live and MotorIQ starts capturing, scoring, and tracking leads.",
              },
            ].map((s) => (
              <div key={s.step} className="space-y-2">
                <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500 flex items-center justify-center mx-0 md:mx-auto text-sm font-semibold text-blue-300">
                  {s.step}
                </div>
                <h3 className="font-semibold text-slate-100 text-sm md:text-base">{s.title}</h3>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offer section */}
      <section id="offer" className="py-20 px-6 bg-slate-950">
        <div className="max-w-3xl mx-auto rounded-2xl border border-blue-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 p-8">
          <h2
            className="text-2xl font-bold mb-4 text-center"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Done-for-you onboarding for serious dealers
          </h2>
          <p className="text-slate-300 text-center mb-6 text-sm">
            When you come on board, our team sets up an entire sales engine for your dealership — not just software.
          </p>
          <ul className="space-y-2 text-slate-200 text-sm max-w-xl mx-auto">
            <li>✓ Free domain for 1 year</li>
            <li>✓ Free hosting for 1 year</li>
            <li>✓ Preconfigured dealer dashboard</li>
            <li>✓ Website setup and branding</li>
            <li>✓ AI credits included for lead scoring, follow-ups, and ad copy</li>
          </ul>
        </div>
      </section>

      {/* Call to action + interest form */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-900 to-blue-950/40">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Ready to see MotorIQ for your dealership?
            </h2>
            <p className="text-slate-300 mb-5 text-sm md:text-base">
              Share a few details about your dealership and we’ll reach out with a tailored walkthrough and pricing for your
              exact situation.
            </p>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500"
            >
              I'm Interested
            </button>
            <p className="text-slate-500 text-xs mt-3">
              No obligation. We only onboard a limited number of dealers at a time to keep support personal.
            </p>
          </div>

          {formOpen && (
            <form onSubmit={handleSubmit} className="space-y-3 bg-slate-900/70 rounded-2xl border border-slate-700 p-5">
              <h3 className="text-lg font-semibold mb-1">Tell us about your dealership</h3>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Your name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Dealership name</label>
                  <input
                    type="text"
                    value={form.dealershipName}
                    onChange={(e) => handleChange("dealershipName", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Phone (WhatsApp)</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">City</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Estimated cars in stock</label>
                    <input
                      type="number"
                      min="0"
                      value={form.inventorySize}
                      onChange={(e) => handleChange("inventorySize", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit interest"}
                </button>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-slate-800 bg-slate-950">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div>
            <span className="font-semibold text-slate-200">MotorIQ</span> — Turn browsers into buyers.
          </div>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-slate-200">
              Privacy
            </Link>
            <span>Made in Kenya 🇰🇪</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
