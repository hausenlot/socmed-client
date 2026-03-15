import { post } from './api';

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
}

interface LoginResponse {
  token: string;
  user?: AuthUser;
  username?: string;
  displayName?: string;
  id?: number;
}

// Try to extract user info from the JWT payload if the response doesn't include it
function decodeTokenPayload(token: string): Partial<AuthUser> {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64);
    const payload = JSON.parse(json);
    return {
      id: payload.nameid ? Number(payload.nameid) : payload.sub ? Number(payload.sub) : 0,
      username: payload.unique_name || payload.name || payload.preferred_username || '',
      displayName: payload.given_name || payload.unique_name || payload.name || '',
    };
  } catch {
    return {};
  }
}

function storeAuth(res: LoginResponse): LoginResponse {
  localStorage.setItem('token', res.token);

  // The backend may return { token, user: {...} } or { token, username, displayName, id } or just { token }
  let user: AuthUser;
  if (res.user && res.user.username) {
    user = res.user;
  } else if (res.username) {
    user = { id: res.id ?? 0, username: res.username, displayName: res.displayName ?? res.username };
  } else {
    // Fallback: decode the JWT
    const decoded = decodeTokenPayload(res.token);
    user = {
      id: decoded.id ?? 0,
      username: decoded.username ?? '',
      displayName: decoded.displayName ?? decoded.username ?? '',
    };
  }

  localStorage.setItem('user', JSON.stringify(user));
  // Attach user to the response so callers can use it
  res.user = user;
  return res;
}

export async function register(username: string, password: string, displayName: string): Promise<LoginResponse> {
  const res = await post<LoginResponse>('/auth/register', { username, password, displayName });
  return storeAuth(res);
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await post<LoginResponse>('/auth/login', { username, password });
  return storeAuth(res);
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getCurrentUser(): AuthUser | null {
  const raw = localStorage.getItem('user');
  if (!raw || raw === 'undefined' || raw === 'null') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
