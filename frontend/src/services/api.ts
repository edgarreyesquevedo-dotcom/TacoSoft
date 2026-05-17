import type { User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface Session {
  token: string;
  user: User;
}

let session: Session | null = JSON.parse(localStorage.getItem('tacosoft.session') || 'null');

export function getSession() {
  return session;
}

export function saveSession(next: Session | null) {
  session = next;
  if (next) localStorage.setItem('tacosoft.session', JSON.stringify(next));
  else localStorage.removeItem('tacosoft.session');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || 'Error de comunicacion con la API');
  }
  return data as T;
}

export const postJson = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const putJson = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'PUT', body: JSON.stringify(body) });

export const patchJson = <T>(path: string, body: unknown = {}) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
