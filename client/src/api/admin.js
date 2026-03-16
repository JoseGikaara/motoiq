import { getApiBase } from "../config/apiBase";

const API = getApiBase();

const ADMIN_TOKEN_KEY = "motoriq_admin_token";

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function adminApi(path, options = {}) {
  const token = getAdminToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const admin = {
  login: (body) => adminApi("/api/admin/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => adminApi("/api/admin/auth/me"),
  stats: () => adminApi("/api/admin/stats"),
  dealers: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return adminApi("/api/admin/dealers" + (q ? "?" + q : ""));
  },
  dealer: (id) => adminApi("/api/admin/dealers/" + id),
  createDealer: (data) => adminApi("/api/admin/dealers", { method: "POST", body: JSON.stringify(data) }),
  updateDealer: (id, data) => adminApi("/api/admin/dealers/" + id, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDealer: (id) => adminApi("/api/admin/dealers/" + id, { method: "DELETE" }),
  suspendDealer: (id) => adminApi("/api/admin/dealers/" + id + "/suspend", { method: "POST" }),
  activateDealer: (id) => adminApi("/api/admin/dealers/" + id + "/activate", { method: "POST" }),
  subscriptions: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return adminApi("/api/admin/subscriptions" + (q ? "?" + q : ""));
  },
  expiringSubscriptions: () => adminApi("/api/admin/subscriptions/expiring"),
  createSubscription: (body) => adminApi("/api/admin/subscriptions", { method: "POST", body: JSON.stringify(body) }),
  updateSubscription: (id, data) => adminApi("/api/admin/subscriptions/" + id, { method: "PATCH", body: JSON.stringify(data) }),
  activity: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return adminApi("/api/admin/activity" + (q ? "?" + q : ""));
  },
  systemHealth: () => adminApi("/api/admin/system/health"),
  systemUsage: () => adminApi("/api/admin/system/usage"),
  systemEnv: () => adminApi("/api/admin/system/env"),
  testEmail: () => adminApi("/api/admin/system/test-email", { method: "POST" }),
  applications: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return adminApi("/api/admin/applications" + (q ? "?" + q : ""));
  },
  application: (id) => adminApi("/api/admin/applications/" + id),
  confirmPayment: (id, data) => adminApi("/api/admin/applications/" + id + "/payment", { method: "PATCH", body: JSON.stringify(data) }),
  approveApplication: (id) => adminApi("/api/admin/applications/" + id + "/approve", { method: "POST" }),
  rejectApplication: (id, reason) => adminApi("/api/admin/applications/" + id + "/reject", { method: "POST", body: JSON.stringify({ reason }) }),
  sendPaymentInstructions: (id) => adminApi("/api/admin/applications/" + id + "/send-payment-instructions", { method: "PATCH" }),
  interestedDealers: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return adminApi("/api/admin/interested-dealers" + (q ? "?" + q : ""));
  },
  updateInterestedDealer: (id, data) =>
    adminApi("/api/admin/interested-dealers/" + id, { method: "PATCH", body: JSON.stringify(data) }),
};
