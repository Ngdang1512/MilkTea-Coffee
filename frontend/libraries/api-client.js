import { APP_CONFIG } from "../configs/app-config.js";

const TOKEN_KEY = "milktea-customer-token";

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
  submitSurvey: (id, answers) => request(`/me/surveys/${id}/submit`, { method: "POST", body: { answers } })
};
