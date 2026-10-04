import { APP_CONFIG } from "../configs/app-config.js";

const TOKEN_KEY = "milktea-customer-token";
const internalPortal = location.port === "4173" || location.pathname.includes("admin") ? "admin" : "manager";
const INTERNAL_TOKEN_KEY = `milktea-${internalPortal}-token`;

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Không thể kết nối máy chủ");
    error.code = data.code;
    error.status = response.status;
    if (response.status === 401) localStorage.removeItem(TOKEN_KEY);
    throw error;
  }
  return data;
}

export const customerApi = {
  hasToken: () => Boolean(localStorage.getItem(TOKEN_KEY)),
  logout: () => localStorage.removeItem(TOKEN_KEY),
  options: () => request("/catalogs/options"),
  async login(credentials) {
    const data = await request("/auth/login", { method: "POST", body: credentials });
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },
  async register(payload) {
    const data = await request("/auth/register", { method: "POST", body: payload });
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },
  me: () => request("/me"),
  updateMe: profile => request("/me", { method: "PATCH", body: profile }),
  feedback: () => request("/me/feedback"),
  sendFeedback: feedback => request("/me/feedback", { method: "POST", body: feedback }),
  surveys: () => request("/me/surveys"),
  survey: id => request(`/me/surveys/${id}`),
  submitSurvey: (id, answers) => request(`/me/surveys/${id}/submit`, { method: "POST", body: { answers } }),
  notifications: () => request("/me/notifications"),
  readNotification: id => request(`/me/notifications/${id}`, { method: "PATCH" })
};

async function internalRequest(path, options = {}) {
  const token = localStorage.getItem(INTERNAL_TOKEN_KEY);
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Không thể kết nối máy chủ");
    error.code = data.code;
    error.status = response.status;
    if (response.status === 401) localStorage.removeItem(INTERNAL_TOKEN_KEY);
    throw error;
  }
  return data;
}

export const internalApi = {
  portal: internalPortal,
  hasToken: () => Boolean(localStorage.getItem(INTERNAL_TOKEN_KEY)),
  logout: () => localStorage.removeItem(INTERNAL_TOKEN_KEY),
  async login(credentials) {
    const data = await internalRequest("/internal/auth/login", { method: "POST", body: credentials });
    localStorage.setItem(INTERNAL_TOKEN_KEY, data.token);
    return data;
  },
  me: () => internalRequest("/internal/me"),
  dashboard: () => internalRequest("/internal/dashboard"),
  customers: () => internalRequest("/internal/customers"),
  feedback: () => internalRequest("/internal/feedback"),
  updateFeedback: (id, status, reply = "") => internalRequest(`/internal/feedback/${id}`, { method: "PATCH", body: { status, reply } }),
  surveys: () => internalRequest("/internal/surveys"),
  createSurvey: survey => internalRequest("/internal/surveys", { method: "POST", body: survey }),
  accounts: () => internalRequest("/internal/accounts"),
  branches: () => internalRequest("/internal/branches"),
  catalogs: () => internalRequest("/internal/catalogs")
};
