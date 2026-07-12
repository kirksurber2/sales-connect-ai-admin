import { fetchAuthSession } from '@aws-amplify/auth';

const BASE_URL = import.meta.env.VITE_ADMIN_API;

async function getHeaders() {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}

async function request(path, options = {}) {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
