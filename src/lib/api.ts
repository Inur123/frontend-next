// src/lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_BASE;

type ApiFetchOptions = {
  method?: string;
  token?: string | null;
  body?: any;
};

export async function apiFetch<T = any>(path: string, opts: ApiFetchOptions = {}) {
  if (!BASE) throw new Error("NEXT_PUBLIC_API_BASE belum di-set di .env.local");

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message || "Request failed";
    throw new Error(msg);
  }

  return data as T;
}
