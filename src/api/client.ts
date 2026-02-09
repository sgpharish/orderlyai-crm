import { API_BASE_URL } from '../config';

const BASE_URL = API_BASE_URL;

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

export async function api<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...init } = options;
  const url = path.startsWith('http') ? path : `${BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {};
  const initHeaders = init.headers;
  if (typeof initHeaders === 'object' && initHeaders !== null && !(initHeaders instanceof Headers)) {
    Object.assign(headers, initHeaders);
  }
  if (!headers['Content-Type'] && !(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (!skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    clearToken();
    localStorage.removeItem('crm_user');
    window.location.href = '/login';
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const j = JSON.parse(text);
      if (j.message) message = j.message;
    } catch {
      // use text
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return Promise.resolve(undefined) as Promise<T>;
  }
  return res.json() as Promise<T>;
}

/** Fetch a URL as blob (e.g. document download). Uses same base URL and auth as api(). */
export async function fetchBlob(path: string): Promise<Blob> {
  const url = path.startsWith('http') ? path : `${BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (res.status === 401) {
    clearToken();
    localStorage.removeItem('crm_user');
    window.location.href = '/login';
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  return res.blob();
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export function setToken(token: string): void {
  localStorage.setItem('access_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('access_token');
}
