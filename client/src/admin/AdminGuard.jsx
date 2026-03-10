import { Navigate, useLocation } from "react-router-dom";

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function AdminGuard({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("motoriq_admin_token");
  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  const payload = parseJwt(token);
  if (!payload || payload.role !== "ADMIN") {
    localStorage.removeItem("motoriq_admin_token");
    localStorage.removeItem("motoriq_admin_name");
    localStorage.removeItem("motoriq_admin_email");
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
