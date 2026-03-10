import { useMemo, useState } from "react";
import { Percent } from "lucide-react";

const DEFAULT_RATE = 14;
const MIN_TERM = 12;
const MAX_TERM = 60;

export default function FinanceCalculator({
  carPrice,
  defaultRate = DEFAULT_RATE,
  onGetPreApproved,
  primaryColor = "#2563EB",
}) {
  const [downPayment, setDownPayment] = useState("");
  const [rate, setRate] = useState(String(defaultRate));
  const [term, setTerm] = useState("48");

  const loanAmount = useMemo(() => {
    const price = Number(carPrice) || 0;
    const down = Number(downPayment) || 0;
    return Math.max(0, price - down);
  }, [carPrice, downPayment]);

  const monthlyPayment = useMemo(() => {
    if (loanAmount <= 0) return 0;
    const r = Number(rate) || 0;
    const n = Number(term) || 48;
    if (r <= 0) return loanAmount / n;
    const monthlyRate = r / 100 / 12;
    return (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  }, [loanAmount, rate, term]);

  return (
    <div id="financing" className="rounded-xl border border-white/10 bg-navy-card/60 p-6">
      <h3 className="font-heading font-semibold text-lg flex items-center gap-2 mb-4" style={{ color: primaryColor }}>
        <Percent className="w-5 h-5" />
        Finance calculator
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Loan amount (KES)</label>
          <input
            type="number"
            readOnly
            value={loanAmount > 0 ? loanAmount.toLocaleString() : (carPrice || 0).toLocaleString()}
            className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Down payment (KES)</label>
          <input
            type="number"
            min={0}
            value={downPayment}
            onChange={(e) => setDownPayment(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Interest rate (% p.a.)</label>
          <input
            type="number"
            min={0}
            max={30}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Term (months)</label>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
          >
            {Array.from({ length: MAX_TERM - MIN_TERM + 1 }, (_, i) => MIN_TERM + i).map((m) => (
              <option key={m} value={m}>{m} months</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg font-semibold text-white">
          Est. monthly: <span style={{ color: primaryColor }}>KES {Math.round(monthlyPayment).toLocaleString()}</span>
        </p>
        {onGetPreApproved && (
          <button
            type="button"
            onClick={onGetPreApproved}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Get pre-approved
          </button>
        )}
      </div>
    </div>
  );
}
