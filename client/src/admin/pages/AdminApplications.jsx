import { useState, useEffect } from "react";
import { admin } from "../../api/admin.js";

const STATUS_COLORS = {
  SUBMITTED: "bg-slate-500",
  PAYMENT_PENDING: "bg-yellow-600",
  PAYMENT_SUBMITTED: "bg-orange-600",
  UNDER_REVIEW: "bg-blue-600",
  APPROVED: "bg-green-600",
  REJECTED: "bg-red-600",
  ACTIVE: "bg-green-600",
};

const PAYMENT_COLORS = { PENDING: "bg-slate-500", SUBMITTED: "bg-orange-600", CONFIRMED: "bg-green-600", REJECTED: "bg-red-600" };

export default function AdminApplications() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);

  useEffect(() => {
    const params = filter !== "all" ? { status: filter } : {};
    admin.applications(params).then(setList).catch(() => setList([])).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    if (!selected) return;
    admin.application(selected.id).then(setSelected).catch(() => setSelected(null));
  }, [selected?.id]);

  const openDetail = (app) => setSelected(app);
  const closeDetail = () => { setSelected(null); setTempPassword(null); };

  const handleSendPaymentInstructions = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await admin.sendPaymentInstructions(selected.id);
      const updated = await admin.application(selected.id);
      setSelected(updated);
      setList((prev) => prev.map((a) => (a.id === selected.id ? updated : a)));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await admin.confirmPayment(selected.id, { paymentStatus: "CONFIRMED" });
      const updated = await admin.application(selected.id);
      setSelected(updated);
      setList((prev) => prev.map((a) => (a.id === selected.id ? updated : a)));
      if (res.tempPassword) setTempPassword(res.tempPassword);
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await admin.confirmPayment(selected.id, { paymentStatus: "REJECTED" });
      const updated = await admin.application(selected.id);
      setSelected(updated);
      setList((prev) => prev.map((a) => (a.id === selected.id ? updated : a)));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selected || !confirm(`Create dealer account and send login to ${selected.email}?`)) return;
    setActionLoading(true);
    try {
      const res = await admin.approveApplication(selected.id);
      const updated = await admin.application(selected.id);
      setSelected(updated);
      setList((prev) => prev.map((a) => (a.id === selected.id ? updated : a)));
      setTempPassword(res.tempPassword);
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await admin.rejectApplication(selected.id, rejectReason);
      const updated = await admin.application(selected.id);
      setSelected(updated);
      setList((prev) => prev.map((a) => (a.id === selected.id ? updated : a)));
      setRejectReason("");
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = list.filter((a) => ["SUBMITTED", "PAYMENT_SUBMITTED", "PAYMENT_PENDING"].includes(a.status)).length;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Applications</h2>
      <div className="flex flex-wrap gap-2">
        {["all", "SUBMITTED", "PAYMENT_PENDING", "PAYMENT_SUBMITTED", "ACTIVE", "REJECTED"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm ${filter === f ? "bg-slate-600 text-white" : "bg-slate-700/50 text-slate-400"}`}>
            {f === "all" ? "All" : f.replace(/_/g, " ")}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-slate-400 text-center">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="p-3">Applicant</th>
                <th className="p-3">Dealership</th>
                <th className="p-3">City</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Applied</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3">
                    <button type="button" onClick={() => openDetail(a)} className="text-left text-white hover:underline">
                      {a.fullName}<br /><span className="text-slate-500 text-xs">{a.email}</span>
                    </button>
                  </td>
                  <td className="p-3 text-slate-300">{a.dealershipName}</td>
                  <td className="p-3 text-slate-400">{a.city}</td>
                  <td className="p-3 text-slate-400">{a.selectedPlan}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${PAYMENT_COLORS[a.paymentStatus] || "bg-slate-600"}`}>{a.paymentStatus}</span></td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[a.status] || "bg-slate-600"}`}>{a.status}</span></td>
                  <td className="p-3 text-slate-500">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}</td>
                  <td className="p-3"><button type="button" onClick={() => openDetail(a)} className="text-red-400 text-xs">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && list.length === 0 && <div className="p-8 text-slate-500 text-center">No applications</div>}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={closeDetail}>
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex justify-between items-start border-b border-slate-700">
              <h3 className="text-lg font-semibold">{selected.fullName} — {selected.dealershipName}</h3>
              <button type="button" onClick={closeDetail} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-500">Email:</span> {selected.email}</p>
                <p><span className="text-slate-500">Phone:</span> {selected.phone}</p>
                <p><span className="text-slate-500">City:</span> {selected.city}</p>
                <p><span className="text-slate-500">Stock:</span> {selected.stockSize} | Leads: {selected.monthlyLeads}</p>
                <p><span className="text-slate-500">Process:</span> {selected.currentProcess}</p>
                <p><span className="text-slate-500">Plan:</span> {selected.selectedPlan} | KES {selected.paymentAmount?.toLocaleString()}</p>
                <p><span className="text-slate-500">Payment ref:</span> {selected.paymentRef || "—"}</p>
                {selected.paymentProof && <p><a href={selected.paymentProof} target="_blank" rel="noreferrer" className="text-blue-400">View proof</a></p>}
              </div>
              <div className="space-y-3">
                {tempPassword && (
                  <div className="p-3 rounded-lg bg-green-500/20 text-green-400 text-sm">
                    Account created. Temp password: <code className="font-mono">{tempPassword}</code>
                    <button type="button" onClick={() => navigator.clipboard.writeText(tempPassword)} className="ml-2 text-xs">Copy</button>
                  </div>
                )}
                {["SUBMITTED", "UNDER_REVIEW"].includes(selected.status) && (
                  <button type="button" onClick={handleSendPaymentInstructions} disabled={actionLoading} className="w-full py-2 rounded-lg bg-orange-600 text-white text-sm">Send payment instructions</button>
                )}
                {selected.status === "PAYMENT_SUBMITTED" && (
                  <>
                    <button type="button" onClick={handleConfirmPayment} disabled={actionLoading} className="w-full py-2 rounded-lg bg-green-600 text-white text-sm">Confirm payment ✓</button>
                    <button type="button" onClick={handleRejectPayment} disabled={actionLoading} className="w-full py-2 rounded-lg bg-red-600 text-white text-sm">Reject payment ✗</button>
                  </>
                )}
                {selected.paymentStatus === "CONFIRMED" && !selected.dealerId && (
                  <button type="button" onClick={handleApprove} disabled={actionLoading} className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm">Approve & create account</button>
                )}
                {!["REJECTED", "ACTIVE"].includes(selected.status) && (
                  <>
                    <input type="text" placeholder="Rejection reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm" />
                    <button type="button" onClick={handleReject} disabled={actionLoading} className="w-full py-2 rounded-lg border border-red-500 text-red-400 text-sm">Reject application</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
