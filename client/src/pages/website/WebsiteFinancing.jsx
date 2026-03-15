import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Calculator, Percent, Banknote, Tag } from "lucide-react";
import { publicSite } from "../../api";

const defaultOffers = [
  { name: "Bank loan (typical)", ratePct: 14, termMonths: 48, minDepositPct: 20 },
  { name: "SACCO", ratePct: 12, termMonths: 36, minDepositPct: 25 },
];

export default function WebsiteFinancing() {
  const { slug } = useParams();
  const [dealer, setDealer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState("");
  const [depositPercent, setDepositPercent] = useState("20");
  const [termMonths, setTermMonths] = useState("48");
  const [rate, setRate] = useState("14");
  const [selectedOfferId, setSelectedOfferId] = useState(null);

  const offers = (dealer?.financingOffers && dealer.financingOffers.length > 0)
    ? dealer.financingOffers
    : defaultOffers;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const d =
          slug === "host"
            ? await publicSite.getByHost(window.location.hostname)
            : await publicSite.getBySlug(slug);
        if (cancelled) return;
        setDealer(d);
        document.title = `${d.dealershipName} | Financing`;
        if (d.financingOffers?.length > 0) {
          const first = d.financingOffers[0];
          setRate(String(first.ratePct ?? 14));
          setTermMonths(String(first.termMonths ?? first.termMax ?? 48));
          setDepositPercent(String(first.minDepositPct ?? 20));
          setSelectedOfferId((first.name || "Offer") + "0");
        }
      } catch (e) {
        if (!cancelled) toast.error(e.message || "Dealer website not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading && !dealer) {
    return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Loading…</div>;
  }
  if (!dealer) {
    return <div className="min-h-screen flex items-center justify-center bg-navy text-gray-400">Dealer website not found.</div>;
  }

  const p = Number(price) || 0;
  const depPct = Number(depositPercent) || 0;
  const monthlyRate = (Number(rate) || 0) / 100 / 12;
  const months = Number(termMonths) || 1;
  const deposit = p * (depPct / 100);
  const financed = Math.max(0, p - deposit);
  // Simple reducing-balance approximation
  const approxMonthly =
    monthlyRate > 0 ? (financed * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1) : financed / months;

  return (
    <div className="min-h-screen bg-navy text-white">
      <header className="border-b border-white/10 bg-navy-card/60">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {dealer.logoUrl && <img src={dealer.logoUrl} alt={dealer.dealershipName} className="h-9 w-9 rounded-lg object-contain bg-slate-900" />}
            <div>
              <p className="font-heading font-bold text-lg">{dealer.dealershipName}</p>
              {dealer.city && <p className="text-xs text-gray-400">{dealer.city}</p>}
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-xs text-gray-300">
            <Link to={`/s/${slug}`} className="hover:text-white">Home</Link>
            <Link to={`/s/${slug}/inventory`} className="hover:text-white">Inventory</Link>
            <Link to={`/s/${slug}/about`} className="hover:text-white">About</Link>
            <span className="text-white">Financing</span>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {offers.length > 0 && (
          <section className="bg-navy-card rounded-xl border border-white/10 p-5">
            <h2 className="font-heading font-semibold text-base mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-accent-blue" />
              {dealer?.financingOffers?.length ? "Our financing options" : "Typical options"}
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Select a plan to pre-fill the calculator below.
            </p>
            <div className="flex flex-wrap gap-2">
              {offers.map((offer, idx) => {
                const id = offer.name + idx;
                const isSelected = selectedOfferId === id;
                const term = offer.termMonths ?? offer.termMax ?? 48;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSelectedOfferId(id);
                      setRate(String(offer.ratePct ?? 14));
                      setTermMonths(String(term));
                      if (offer.minDepositPct != null) setDepositPercent(String(offer.minDepositPct));
                    }}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition border ${
                      isSelected
                        ? "bg-accent-blue/20 border-accent-blue text-white"
                        : "border-white/20 text-gray-300 hover:border-white/40 hover:text-white"
                    }`}
                  >
                    {offer.name} — {offer.ratePct}% p.a., {term} months
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-navy-card rounded-xl border border-white/10 p-5">
            <h1 className="font-heading font-bold text-xl mb-2 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Financing calculator
            </h1>
            <p className="text-xs text-gray-300 mb-4">
              Enter the car price and terms to see an estimated monthly repayment. Exact figures depend on your lender and credit profile.
            </p>
            <form className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Car price (KES)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white"
                  placeholder="e.g. 1500000"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 flex items-center gap-1">
                    Deposit %
                    <Percent className="w-3 h-3" />
                  </label>
                  <input
                    type="number"
                    value={depositPercent}
                    onChange={(e) => setDepositPercent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Term (months)</label>
                  <input
                    type="number"
                    value={termMonths}
                    onChange={(e) => setTermMonths(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Interest p.a. (%)</label>
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white"
                  />
                </div>
              </div>
            </form>
            <div className="mt-4 rounded-lg border border-white/10 bg-navy px-4 py-3 text-xs flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Approx. deposit</span>
                <span className="text-white font-semibold">KES {Math.round(deposit || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Amount financed</span>
                <span className="text-white font-semibold">KES {Math.round(financed || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  Est. monthly repayment
                  <Banknote className="w-3 h-3" />
                </span>
                <span className="text-accent-blue font-semibold">
                  KES {Number.isFinite(approxMonthly) ? Math.round(approxMonthly || 0).toLocaleString() : "0"}
                </span>
              </div>
            </div>
          </div>

              <div className="bg-navy-card rounded-xl border border-white/10 p-5 text-xs text-gray-300 space-y-3">
            <h2 className="font-heading font-semibold text-base mb-1">How car finance typically works in Kenya</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Most banks and SACCOs finance between <strong>70% and 90%</strong> of the car price.</li>
              <li>Typical deposits range from <strong>10% to 30%</strong> of the purchase price.</li>
              <li>Repayment periods commonly run from <strong>36 to 60 months</strong>.</li>
              <li>Interest rates vary by lender, usually between <strong>12%–17% p.a.</strong> for bank loans.</li>
              <li>SACCOs sometimes offer lower rates but require membership and regular savings history.</li>
            </ul>
            <p className="text-gray-400 mt-2">
              We can connect you to partner banks and SACCOs for personalised quotes based on your income, CRB status, and employment history.
            </p>
          </div>
        </section>

        <section className="bg-navy-card rounded-xl border border-white/10 p-4 text-xs text-gray-400">
          <p>
            <strong className="text-white">Disclaimer:</strong> This calculator is for illustration only and does not constitute a loan offer.
            Actual repayments depend on your lender’s terms and approval.
          </p>
        </section>
      </main>
    </div>
  );
}

