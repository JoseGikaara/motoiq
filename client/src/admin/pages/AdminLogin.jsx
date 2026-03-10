import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { admin, clearAdminToken } from "../../api/admin.js";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      clearAdminToken();
      const { admin: a, token } = await admin.login({ email, password });
      localStorage.setItem("motoriq_admin_token", token);
      localStorage.setItem("motoriq_admin_name", a.name || "");
      localStorage.setItem("motoriq_admin_email", a.email || "");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800/80 p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-white mb-1">MotorIQ Admin Console</h1>
        <p className="text-slate-400 text-sm mb-6">Sign in with your admin account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-white placeholder-slate-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              placeholder="admin@motoriq.co.ke"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-white placeholder-slate-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
