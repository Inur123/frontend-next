// src/lib/api.ts

const BASE = process.env.NEXT_PUBLIC_API_BASE;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

type ApiFetchOptions = {
  method?: string;
  token?: string | null;
  body?: any;
  headers?: Record<string, string>;
};

export async function apiFetch<T = any>(path: string, opts: ApiFetchOptions = {}) {
  if (!BASE) throw new Error("NEXT_PUBLIC_API_BASE belum di-set di .env.local");

  const method = (opts.method || "GET").toUpperCase();

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.headers || {}),
    },
    body: method === "GET" || method === "HEAD" ? undefined : opts.body ? JSON.stringify(opts.body) : undefined,
  });

  // ✅ handle response yang bukan JSON
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `Request failed (${res.status} ${res.statusText})`;
    throw new Error(msg);
  }

  return data as T;
}
