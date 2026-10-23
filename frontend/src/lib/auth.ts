import api from './api';
import type { User } from './types';

export async function login(email: string, password: string) {
  const { data } = await api.post<{ user: User; token: string }>(
    '/auth/login',
    { email, password }
  );

  return data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  return raw ? (JSON.parse(raw) as User) : null;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function storeSession(user: User, token: string) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
}