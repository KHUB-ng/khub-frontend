const DEFAULT_API_BASE_URL = 'https://api.khub.com.ng/api';
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

const ACCESS_TOKEN_KEY = 'khub.access_token';
const REFRESH_TOKEN_KEY = 'khub.refresh_token';

export class ApiError extends Error {
  constructor(message, { status = 0, code = null, details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const sessionTokens = {
  getAccessToken: () => sessionStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => sessionStorage.getItem(REFRESH_TOKEN_KEY),
  set: ({ token, refresh_token }) => {
    if (!token || !refresh_token) throw new Error('The API did not return a complete session.');
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
  },
  clear: () => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

function parseResponseBody(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function readResponse(response) {
  const text = await response.text();
  const body = parseResponseBody(text);
  if (!response.ok) {
    const message = body?.message || body?.error || `Request failed with status ${response.status}.`;
    throw new ApiError(message, {
      status: response.status,
      code: body?.code || body?.error_code || null,
      details: body,
    });
  }
  return body;
}

let refreshInFlight = null;

async function refreshSession() {
  const refresh_token = sessionTokens.getRefreshToken();
  if (!refresh_token) {
    sessionTokens.clear();
    return false;
  }

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refresh_token }),
          credentials: 'omit',
        });
        if (!response.ok) {
          sessionTokens.clear();
          return false;
        }
        sessionTokens.set(await readResponse(response));
        return true;
      } catch {
        sessionTokens.clear();
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function apiRequest(path, options = {}) {
  const {
    auth = true,
    retryOnUnauthorized = true,
    headers: suppliedHeaders = {},
    body,
    ...requestOptions
  } = options;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = new Headers(suppliedHeaders);
  headers.set('Accept', 'application/json');
  if (body !== undefined && body !== null && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = sessionTokens.getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...requestOptions,
    headers,
    body: body === undefined || body === null || isFormData || typeof body === 'string'
      ? body
      : JSON.stringify(body),
    credentials: 'omit',
  });

  if (response.status === 401 && auth && retryOnUnauthorized && !path.startsWith('/auth/refresh')) {
    const refreshed = await refreshSession();
    if (refreshed) return apiRequest(path, { ...options, retryOnUnauthorized: false });
    sessionTokens.clear();
  }

  return readResponse(response);
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
  upload: (path, formData, options) => apiRequest(path, { ...options, method: 'POST', body: formData }),
};

export function apiUrl(path) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
