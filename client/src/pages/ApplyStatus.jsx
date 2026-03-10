import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { onboarding } from "../api";

const API = import.meta.env.VITE_API_URL || "";

export default function ApplyStatus() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentTab, setPaymentTab] = useState("MPESA");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    function fetchStatus() {
      onboarding.status(email).then((d) => { if (!cancelled) setData(d); }).catch(() => { if (!cancelled) setData(null); }).finally(() => { if (!cancelled) setLoading(false); });
    }
    fetchStatus();
    const t = setInterval(fetchStatus, 30000);
    return () => { clearInterval(t); cancelled = true; };
  }, [email]);

  const handlePaymentProof = async (e) => {
    e.preventDefault();
    if (!data?.applicationId || !paymentRef) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      await onboarding.paymentProof({
        applicationId: data.applicationId,
        paymentRef,
        paymentMethod: paymentTab,
        paymentProofUrl: paymentProofUrl || undefined,
      });
      setData((d) => d ? { ...d, status: "PAYMENT_SUBMITTED", paymentStatus: "SUBMITTED" } : d);
    } catch (err) {
      setSubmitError(err.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <p className="text-slate-400">Missing email. Use the link from your confirmation email.</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const status = data?.status || "UNKNOWN";
  const isPending = ["SUBMITTED", "UNDER_REVIEW"].includes(status);
  const isPaymentPending = status === "PAYMENT_PENDING";
  const isPaymentSubmitted = status === "PAYMENT_SUBMITTED";
  const isApproved = ["APPROVED", "ACTIVE"].includes(status);
  const isRejected = status === "REJECTED";

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700 py-4 px-6">
        <a href="/" className="font-semibold text-xl">MotorIQ</a>
      </header>
      <div className="max-w-xl mx-auto px-6 py-8">
        {isPending && (
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Application under review</h1>
            <p className="text-slate-400 mb-6">We'll send payment instructions to {email} within 30 minutes.</p>
            <a href="https://wa.me/254700000000" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Questions? Chat on WhatsApp →</a>
          </div>
        )}

        {isPaymentPending && (
          <div className="space-y-6">
            <div className="rounded-xl border-2 border-orange-500/50 bg-slate-800/50 p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Instructions</h2>
              <p className="text-slate-300 mb-2">Amount Due: KES {(data.paymentInstructions?.amount || 70000).toLocaleString()}</p>
              <div className="flex gap-2 border-b border-slate-600 pb-4 mb-4">
                {["MPESA", "BANK_TRANSFER", "EQUITY"].map((m) => (
                  <button key={m} onClick={() => setPaymentTab(m)} className={`px-4 py-2 rounded-lg text-sm ${paymentTab === m ? "bg-blue-600" : "bg-slate-700"}`}>{m}</button>
                ))}
              </div>
              {paymentTab === "MPESA" && (
                <div className="text-sm text-slate-300 space-y-1">
                  <p>Paybill: 522522</p>
                  <p>Account: MotorIQ-{data.paymentInstructions?.accountSuffix || "------"}</p>
                  <p>Amount: KES 70,000</p>
                  <p className="mt-2">Steps: M-Pesa → Lipa na M-Pesa → Pay Bill → Enter details → Screenshot confirmation</p>
                </div>
              )}
              {paymentTab === "BANK_TRANSFER" && (
                <div className="text-sm text-slate-300 space-y-1">
                  <p>Bank: Equity Bank | Account: MotorIQ Limited | 1234567890</p>
                  <p>Branch: Westlands, Nairobi</p>
                  <p>Reference: MotorIQ-{data.applicationId}</p>
                </div>
              )}
              {paymentTab === "EQUITY" && (
                <div className="text-sm text-slate-300">Equity *247# or send to 0712 345 678. Reference: {data.applicationId}</div>
              )}
            </div>

            <form onSubmit={handlePaymentProof} className="space-y-4">
              <h3 className="font-medium">I've made payment</h3>
              <input type="text" placeholder="M-Pesa / Transaction reference *" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white" required />
              <input type="url" placeholder="Payment screenshot URL (optional)" value={paymentProofUrl} onChange={(e) => setPaymentProofUrl(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white" />
              {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
              <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50">{submitting ? "Submitting…" : "Confirm my payment →"}</button>
            </form>
          </div>
        )}

        {isPaymentSubmitted && (
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Payment under review</h1>
            <p className="text-slate-400 mb-2">We received your payment confirmation. Verifying now.</p>
            <p className="text-slate-500 text-sm">Expected activation: within 2 hours</p>
          </div>
        )}

        {isApproved && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 text-green-400 text-4xl">✓</div>
            <h1 className="text-2xl font-bold mb-2">Your account is ready!</h1>
            <p className="text-slate-400 mb-6">Check your email ({email}) for login credentials.</p>
            <button onClick={() => navigate("/login")} className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium">Login to MotorIQ →</button>
          </div>
        )}

        {isRejected && (
          <div className="text-center">
            <h1 className="text-xl font-semibold mb-2 text-red-400">Application not approved</h1>
            <p className="text-slate-400 mb-6">Contact us to discuss.</p>
            <a href="https://wa.me/254700000000" target="_blank" rel="noreferrer" className="inline-block py-3 px-6 rounded-lg bg-green-600 text-white mb-4">Chat on WhatsApp</a>
            <button onClick={() => navigate("/apply")} className="block w-full py-3 rounded-lg border border-slate-600">Apply again</button>
          </div>
        )}

        {!data && !loading && (
          <p className="text-slate-400 text-center">No application found for this email.</p>
        )}
      </div>
    </div>
  );
}
