import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleDemo() {
    setDemoLoading(true);
    try {
      await demoLogin();
      toast.success("Demo loaded!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Demo failed");
    } finally {
      setDemoLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl text-white">
            <span className="text-accent-blue">Motor</span>IQ
          </h1>
          <p className="text-gray-400 mt-1">Turn browsers into buyers.</p>
        </div>
        <div className="bg-navy-card rounded-2xl shadow-card border border-white/5 p-6">
          <h2 className="font-heading font-semibold text-lg text-white mb-4">Sign in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                placeholder="you@dealership.co.ke"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-accent-blue text-white font-medium hover:bg-accent-blue/90 transition disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-400">
            Don't have login details yet? Please contact MotorIQ support or your admin to get your dealer account created.
          </p>
          <div className="mt-4 pt-4 border-t border-white/10">
            <button type="button" onClick={handleDemo} disabled={demoLoading} className="w-full py-2.5 rounded-lg border border-yellow-500/50 text-yellow-400 font-medium hover:bg-yellow-500/10 disabled:opacity-50">
              {demoLoading ? "Loading…" : "Try Demo (No signup needed)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
