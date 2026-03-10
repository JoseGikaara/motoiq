import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Landing from "./Landing";

/**
 * Front door for "/" that decides whether to:
 * - show the main MotorIQ landing page (app host)
 * - or redirect to the dealer website shell at /s/host (dealer/custom host)
 */
export default function FrontDoor() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") return;
    const host = window.location.hostname;
    const appHost = import.meta.env.VITE_APP_HOST || "";

    const isAppHost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      (appHost && host === appHost);

    // If it's not the main app host and not localhost, assume dealer/custom host
    if (!isAppHost) {
      navigate("/s/host", { replace: true });
    }
  }, [location.pathname, navigate]);

  return <Landing />;
}

