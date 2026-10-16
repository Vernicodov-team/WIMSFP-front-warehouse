const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5094"
).replace(/\/+$/, "");

const AUTH_TOKEN_KEY = "warehouse.authToken";

export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function buildAuthHeaders(extraHeaders) {
  const token = getAuthToken();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders || {}),
  };
}

export function resolveApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function apiFetch(path, options = {}) {
  const { headers, ...rest } = options;

  return fetch(resolveApiUrl(path), {
    ...rest,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...buildAuthHeaders(headers),
    },
  });
}

export async function apiRequest(path, options = {}) {
  const response = await apiFetch(path, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Ошибка API: ${response.status}`);
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export { API_BASE };
