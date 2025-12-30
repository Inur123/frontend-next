const BASE = process.env.NEXT_PUBLIC_API_BASE;

type ApiFetchOptions = {
  method?: string;
  token?: string | null;
  body?: Record<string, unknown>;
};

export async function apiFetch(
  path: string,
  opts: ApiFetchOptions = {}
): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "message" in data
        ? String((data as { message?: unknown }).message || "Request failed")
        : "Request failed";

    throw new Error(msg);
  }

  return data;
}
