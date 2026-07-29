import axios from 'axios';

const TOKEN_KEY = 'vanguard.token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
  timeout: 20000,
});

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // A dead session should bounce to the login screen rather than surface as
    // a cryptic error on whichever page happened to be open.
    if (status === 401 && !error.config?.url?.includes('/auth/login')) {
      tokenStore.clear();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    error.friendlyMessage =
      error.response?.data?.message ??
      (error.code === 'ECONNABORTED'
        ? 'The server took too long to respond.'
        : 'Something went wrong. Please try again.');
    error.fieldErrors = error.response?.data?.details?.fields ?? null;

    return Promise.reject(error);
  }
);

/** Unwraps the `{ success, data, meta }` envelope the API returns. */
export const unwrap = (response) => response.data.data;
export const unwrapWithMeta = (response) => ({ data: response.data.data, meta: response.data.meta });

export const get = (url, config) => api.get(url, config).then(unwrap);
export const getList = (url, config) => api.get(url, config).then(unwrapWithMeta);
export const post = (url, body) => api.post(url, body).then(unwrap);
export const patch = (url, body) => api.patch(url, body).then(unwrap);
export const del = (url) => api.delete(url).then((r) => r.data);
