// Thin fetch wrapper that attaches Clerk JWT (or dev bypass in development)
let _getToken: (() => Promise<string | null>) | null = null;

export function setClerkTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

export async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...((init.headers as Record<string, string>) || {}),
  };

  const isDev = import.meta.env.DEV;
  if (isDev) {
    headers['X-Dev-User-Id'] = 'user_admin_clerk_id';
  } else if (_getToken) {
    const token = await _getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).error?.message || text; } catch {}
    throw new Error(msg);
  }
  return res;
}

// Convenience methods
export const apiGet = (path: string) => api(path);
export const apiPost = (path: string, body: unknown) =>
  api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
export const apiPut = (path: string, body: unknown) =>
  api(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
export const apiDelete = (path: string, body?: unknown) =>
  api(path, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
