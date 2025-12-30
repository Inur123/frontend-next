const BASE = process.env.NEXT_PUBLIC_API_BASE;

type ApiFetchOptions = {
  method?: string;
  token?: string | null;
  body?: Record<string, unknown>;
};

export async function apiFetch(path: string, opts: ApiFetchOptions = {}) {
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

  return data;
}
