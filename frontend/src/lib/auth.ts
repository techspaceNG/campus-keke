import { clearTokens } from './api';

export interface UserSession {
  id: string;
  username: string;
  email?: string | null;
  role: 'ADMIN' | 'DRIVER' | 'STUDENT';
  student?: {
    id: string;
    regNumber: string;
    fullName: string;
    phone: string;
  } | null;
  driver?: {
    id: string;
    driverCode: string;
    fullName: string;
    phone: string;
    status: string;
    vehicle?: {
      plateNumber: string;
      kekeNumber: string;
    } | null;
  } | null;
}

export function saveUserSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ckk_user_profile', JSON.stringify(session));
}

export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('ckk_user_profile');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logout(): void {
  clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
