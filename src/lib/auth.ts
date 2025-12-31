// src/lib/auth.ts
const KEY = "token";

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, token);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
