import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", dealershipName: "" });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl text-white">
            <span className="text-accent-blue">Motor</span>IQ
          </h1>
          <p className="text-gray-400 mt-1">Turn browsers into buyers.</p>
        </div>
        <div className="bg-navy-card rounded-2xl shadow-card border border-white/5 p-6">
          <h2 className="font-heading font-semibold text-lg text-white mb-4">Create account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {["name", "email", "password", "phone", "dealershipName"].map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {key === "dealershipName" ? "Dealership name" : key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                <input
                  type={key === "password" ? "password" : key === "email" ? "email" : "text"}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-navy border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                  placeholder={key === "dealershipName" ? "Your dealership" : key === "phone" ? "Optional" : ""}
                  required={key !== "phone"}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-accent-blue text-white font-medium hover:bg-accent-blue/90 transition disabled:opacity-50"
            >
              {loading ? "Creating…" : "Register"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-accent-blue hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
