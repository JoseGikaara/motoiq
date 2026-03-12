const API = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("motoriq_token");
}

export async function api(path, options = {}) {
  const token = getToken();
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

export const auth = {
  login: (body) => api("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  demoSetup: () => api("/api/demo/setup", { method: "POST" }),
};

export const cars = {
  list: () => api("/api/cars"),
  get: (id) => api(`/api/cars/${id}`),
  getPublic: (id) => api(`/api/cars/public/${id}`),
  getPost: (id) => api(`/api/cars/${id}/post`),
  create: (body) => api("/api/cars", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/cars/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id) => api(`/api/cars/${id}`, { method: "DELETE" }),
  listPhotos: (carId, angle) => {
    const q = angle ? `?angle=${encodeURIComponent(angle)}` : "";
    return api(`/api/cars/${carId}/photos${q}`);
  },
  addPhotos: (carId, photos) => api(`/api/cars/${carId}/photos`, { method: "POST", body: JSON.stringify({ photos }) }),
  reorderPhotos: (carId, order) => api(`/api/cars/${carId}/photos/reorder`, { method: "PUT", body: JSON.stringify({ order }) }),
  updatePhoto: (carId, photoId, body) => api(`/api/cars/${carId}/photos/${photoId}`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePhoto: (carId, photoId) => api(`/api/cars/${carId}/photos/${photoId}`, { method: "DELETE" }),
  getFacebookReplies: (carId) => api(`/api/cars/${carId}/facebook-replies`),
  bulkUpload: async (file) => {
    const API = import.meta.env.VITE_API_URL || "";
    const token = localStorage.getItem("motoriq_token");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API}/api/cars/bulk-upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  },
};

export async function uploadCarImage(file) {
  const API = import.meta.env.VITE_API_URL || "";
  const token = localStorage.getItem("motoriq_token");
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API}/api/upload/car-image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data.url;
}

export async function uploadCarVideo(file) {
  const API = import.meta.env.VITE_API_URL || "";
  const token = localStorage.getItem("motoriq_token");
  const formData = new FormData();
  formData.append("video", file);
  const res = await fetch(`${API}/api/upload/car-video`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data.url;
}

export const leads = {
  create: (body) => api("/api/leads", { method: "POST", body: JSON.stringify(body) }),
  createWhatsApp: (body) => api("/api/leads/whatsapp", { method: "POST", body: JSON.stringify(body) }),
  createWidget: (body) => api("/api/leads/widget", { method: "POST", body: JSON.stringify(body) }),
  createInterestedDealer: (body) => api("/api/leads/interested-dealer", { method: "POST", body: JSON.stringify(body) }),
  list: () => api("/api/leads"),
  get: (id) => api(`/api/leads/${id}`),
  analytics: (params) => {
    const q = params && (params.affiliateOnly === true || params.affiliateOnly === "true")
      ? "?affiliateOnly=true"
      : "";
    return api(`/api/leads/analytics${q}`);
  },
  updateStatus: (id, status) => api(`/api/leads/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  update: (id, data) =>
    api(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  enrollDrip: (id, body) =>
    api(`/api/leads/${id}/enroll-drip`, { method: "POST", body: JSON.stringify(body) }),
  updateDripEnrollment: (leadId, enrollmentId, body) =>
    api(`/api/leads/${leadId}/drip-enrollment/${enrollmentId}`, { method: "PATCH", body: JSON.stringify(body) }),
  logCommunication: (id, body) =>
    api(`/api/leads/${id}/log-communication`, { method: "POST", body: JSON.stringify(body) }),
  sendSms: (id, body) =>
    api(`/api/leads/${id}/send-sms`, { method: "POST", body: JSON.stringify(body) }),
};

export const dripSequences = {
  list: () => api("/api/drip-sequences"),
  active: () => api("/api/drip-sequences/active"),
  get: (id) => api(`/api/drip-sequences/${id}`),
  create: (body) => api("/api/drip-sequences", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/drip-sequences/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id) => api(`/api/drip-sequences/${id}`, { method: "DELETE" }),
};

export const ai = {
  scoreLead: (body) => api("/api/ai/score-lead", { method: "POST", body: JSON.stringify(body) }),
  followUp: (leadId) => api(`/api/ai/followup/${leadId}`, { method: "POST" }),
  nextActions: (leadId) => api(`/api/ai/next-actions/${leadId}`, { method: "POST" }),
  leadAdvice: (leadId) => api("/api/ai/lead-advice", { method: "POST", body: JSON.stringify({ leadId }) }),
  adCopy: (body) => api("/api/ai/ad-copy", { method: "POST", body: JSON.stringify(body) }),
  carDescription: (body) => api("/api/ai/car-description", { method: "POST", body: JSON.stringify(body) }),
  facebookPosts: (carId) => api("/api/ai/facebook-posts", { method: "POST", body: JSON.stringify({ carId }) }),
  facebookReplies: (carId) => api("/api/ai/facebook-replies", { method: "POST", body: JSON.stringify({ carId }) }),
};

export const settings = {
  get: () => api("/api/settings"),
  update: (data) => api("/api/settings", { method: "PATCH", body: JSON.stringify(data) }),
  incentive: () => api("/api/settings/incentive"),
};

export const banners = {
  list: () => api("/api/banners"),
  create: (body) => api("/api/banners", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/banners/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id) => api(`/api/banners/${id}`, { method: "DELETE" }),
};

export const today = {
  get: () => api("/api/today"),
};

export const showroom = {
  get: (dealerId) => api(`/api/showroom/${dealerId}`),
};

/** Parse JSON from fetch response; on empty/invalid body throw a clear error */
async function parseJsonResponse(r, fallbackError) {
  const text = await r.text();
  if (!text?.trim()) {
    throw new Error(r.ok ? fallbackError : `Server returned empty response (${r.status}). Check that the API is running and VITE_API_URL is correct.`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server returned invalid response. Check that the API is running and VITE_API_URL points to the backend (${API || "not set"}).`);
  }
}

/** Public dealer website (no auth) */
export const publicSite = {
  getBySlug: (slug) =>
    fetch(`${API}/api/public/site/by-slug/${encodeURIComponent(slug)}`).then(async (r) => {
      const d = await parseJsonResponse(r, "Site not found");
      return r.ok ? d : Promise.reject(new Error(d.error || "Site not found"));
    }),
  getByHost: (host) =>
    fetch(`${API}/api/public/site/by-host?host=${encodeURIComponent(host)}`).then(async (r) => {
      const d = await parseJsonResponse(r, "Site not found");
      return r.ok ? d : Promise.reject(new Error(d.error || "Site not found"));
    }),
  getCars: (slug, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`${API}/api/public/site/${encodeURIComponent(slug)}/cars${q ? `?${q}` : ""}`).then(async (r) => {
      const d = await parseJsonResponse(r, "Failed");
      return r.ok ? d : Promise.reject(new Error(d.error || "Failed"));
    });
  },
  getCar: (slug, carId) =>
    fetch(`${API}/api/public/site/${encodeURIComponent(slug)}/cars/${encodeURIComponent(carId)}`).then(async (r) => {
      const d = await parseJsonResponse(r, "Car not found");
      return r.ok ? d : Promise.reject(new Error(d.error || "Car not found"));
    }),
  getBanners: (slug) =>
    fetch(`${API}/api/public/site/${encodeURIComponent(slug)}/banners`).then(async (r) => {
      const d = await parseJsonResponse(r, "Failed");
      return r.ok ? d : Promise.reject(new Error(d.error || "Failed to fetch banners"));
    }),
  submitTradeIn: (slug, body) =>
    fetch(`${API}/api/public/site/${encodeURIComponent(slug)}/trade-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      const d = await parseJsonResponse(r, "Failed to submit");
      return r.ok ? d : Promise.reject(new Error(d.error || "Failed to submit trade-in"));
    }),
};

export const testDrives = {
  list: () => api("/api/test-drives"),
  create: (body) => api("/api/test-drives", { method: "POST", body: JSON.stringify(body) }),
  update: (id, data) => api(`/api/test-drives/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

export const tasks = {
  list: () => api("/api/tasks"),
  count: () => api("/api/tasks/count"),
  markDone: (id) => api(`/api/tasks/${id}/done`, { method: "PATCH" }),
};

const API_BASE = import.meta.env.VITE_API_URL || "";

export const onboarding = {
  // Legacy placeholder to avoid breaking imports; public onboarding flow has been replaced by admin-managed onboarding.
  apply: async () => {
    throw new Error("Public onboarding is disabled. Dealers are onboarded by admins.");
  },
  status: async () => {
    throw new Error("Public onboarding is disabled. Dealers are onboarded by admins.");
  },
  paymentProof: async () => {
    throw new Error("Public onboarding is disabled. Dealers are onboarded by admins.");
  },
  steps: async () => [],
  completeStep: async () => ({}),
};

export const affiliates = {
  summary: () => api("/api/affiliates/summary"),
  list: () => api("/api/affiliates"),
  leaderboard: (period) => api(`/api/affiliates/leaderboard${period ? `?period=${period}` : ""}`),
  commissionRules: () => api("/api/affiliates/commission-rules"),
  createCommissionRule: (body) =>
    api("/api/affiliates/commission-rules", { method: "POST", body: JSON.stringify(body) }),
  payouts: (status) =>
    api(`/api/affiliates/payouts${status ? `?status=${status}` : ""}`),
  create: (body) => api("/api/affiliates", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/affiliates/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  markPaid: (id, amount, reference, notes) =>
    api(`/api/affiliates/${id}/mark-paid`, {
      method: "POST",
      body: JSON.stringify({ amount, reference, notes }),
    }),
  challenges: () => api("/api/affiliates/challenges"),
  createChallenge: (body) =>
    api("/api/affiliates/challenges", { method: "POST", body: JSON.stringify(body) }),
  materials: () => api("/api/affiliates/materials"),
  createMaterial: (body) =>
    api("/api/affiliates/materials", { method: "POST", body: JSON.stringify(body) }),
  deleteMaterial: (id) => api(`/api/affiliates/materials/${id}`, { method: "DELETE" }),
  bulkInvite: (affiliates) =>
    api("/api/affiliates/bulk-invite", { method: "POST", body: JSON.stringify(affiliates) }),
};

export const publicAffiliate = {
  get: (code) =>
    fetch(`${API}/api/public/affiliate/${encodeURIComponent(code)}`).then((r) =>
      r
        .json()
        .then((d) =>
          r.ok ? d : Promise.reject(new Error(d.error || "Affiliate not found"))
        )
    ),
  cars: (code) =>
    fetch(`${API}/api/public/affiliate/${encodeURIComponent(code)}/cars`).then((r) =>
      r
        .json()
        .then((d) => (r.ok ? d : Promise.reject(new Error(d.error || "Failed to load cars"))))
    ),
  referrals: (code) =>
    fetch(`${API}/api/public/affiliate/${encodeURIComponent(code)}/referrals`).then((r) =>
      r
        .json()
        .then((d) => (r.ok ? d : Promise.reject(new Error(d.error || "Failed to load referrals"))))
    ),
  requestPayout: (code, amount) =>
    fetch(`${API}/api/public/affiliate/${encodeURIComponent(code)}/request-payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount) }),
    }).then((r) =>
      r.json().then((d) => (r.ok ? d : Promise.reject(new Error(d.error || "Request failed"))))
    ),
  createLink: (code, body) =>
    fetch(`${API}/api/public/affiliate/${encodeURIComponent(code)}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) =>
      r.json().then((d) => (r.ok ? d : Promise.reject(new Error(d.error || "Failed to create link"))))
    ),
};

export async function downloadMonthlyReport(month) {
  const token = localStorage.getItem("motoriq_token");
  const API = import.meta.env.VITE_API_URL || "";
  const res = await fetch(`${API}/api/reports/monthly?month=${month}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to generate report");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `motoriq-report-${month}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download analytics leads as CSV. Pass month "YYYY-MM" or null for all time. */
export async function downloadAnalyticsCsv(month) {
  const token = localStorage.getItem("motoriq_token");
  const API = import.meta.env.VITE_API_URL || "";
  const qs = month ? `?month=${encodeURIComponent(month)}` : "";
  const res = await fetch(`${API}/api/reports/analytics-csv${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to export CSV");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = month ? `motoriq-analytics-${month}.csv` : `motoriq-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
