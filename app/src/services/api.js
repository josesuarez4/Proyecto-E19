const base = '/api';

async function request(path, options = {}) {
  const headers = options.headers || {};
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(base + path, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || 'api_error');
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

export function register(payload) {
  return request('/usuarios/register', { method: 'POST', body: JSON.stringify(payload) });
}

export function login(payload) {
  return request('/usuarios/login', { method: 'POST', body: JSON.stringify(payload) });
}