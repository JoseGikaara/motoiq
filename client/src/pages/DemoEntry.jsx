import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function DemoEntry() {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        if (cancelled) return;
        await demoLogin();
        toast.success("You're now viewing the live demo.");
        navigate("/dashboard", { replace: true });
      } catch (e) {
        if (cancelled) return;
        toast.error(e?.message || "Demo is currently unavailable");
        navigate("/login", { replace: true });
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [demoLogin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center space-y-3">
        <div className="text-sm text-slate-400 uppercase tracking-[0.2em]">MotorIQ Live Demo</div>
        <div className="text-2xl font-semibold">Loading full demo experience…</div>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          We are spinning up a complete demo dealership for you — dashboard, hosted website, AI chatbot, and 360° tours.
        </p>
      </div>
    </div>
  );
}

