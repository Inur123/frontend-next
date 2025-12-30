"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { getToken } from "@/src/lib/auth";

type MeResponse = {
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      createdAt?: string;
    };
  };
};

type UpdateProfileResponse = {
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      createdAt?: string;
    };
  };
};

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [me, setMe] = useState<MeResponse["data"]["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setMounted(true);
    setToken(getToken());
  }, []);

  async function loadMe() {
    setError("");
    setLoading(true);

    try {
      const t = getToken();
      if (!t) throw new Error("Token tidak ditemukan. Silakan login.");

      const res = (await apiFetch<MeResponse>("/auth/me", { token: t })) as MeResponse;
      setMe(res.data.user);
      setName(res.data.user.name);
      setEmail(res.data.user.email);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal load profile");
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!mounted) return;
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // ✅ REALTIME SSE: kalau ada update profile dari tab lain → reload /me
  useEffect(() => {
    const BASE = process.env.NEXT_PUBLIC_API_BASE;
    if (!BASE) return;

    // kalau belum login, gak usah connect
    if (!token) return;

    const es = new EventSource(`${BASE}/products/stream`); 
    // NOTE: kamu sudah punya stream di /products/stream.
    // Untuk rapi, sebaiknya bikin juga /auth/stream atau /stream global.
    // Tapi kita bisa reuse stream ini karena event broadcast global.

    const onProfileChanged = async (ev: MessageEvent) => {
      try {
        const payload = JSON.parse(ev.data || "{}") as { userId?: number };
        // kalau event bukan untuk user ini → abaikan
        if (!me?.id || payload.userId !== me.id) return;

        await loadMe();
        setSuccess("Profile ter-update (realtime)");
        setTimeout(() => setSuccess(""), 1500);
      } catch {
        // fallback: reload aja
        await loadMe();
      }
    };

    es.addEventListener("profile_changed", onProfileChanged);

    return () => {
      es.removeEventListener("profile_changed", onProfileChanged as any);
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, me?.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Token tidak ada. Silakan login.");
      return;
    }

    setBusy(true);
    try {
      const res = (await apiFetch<UpdateProfileResponse>("/auth/profile", {
        method: "PUT",
        token,
        body: { name, email },
      })) as UpdateProfileResponse;

      setMe(res.data.user);
      setSuccess("Profile berhasil disimpan");
      // load ulang biar sinkron
      await loadMe();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal update profile");
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) return <div className="text-slate-600">Loading...</div>;

  return (
    <div>
      <h1 className="text-xl font-semibold">Profile</h1>
      <p className="text-slate-600 text-sm mt-1">Edit data akun kamu.</p>

      {(error || success) && (
        <div className="mt-4 space-y-2">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 p-3 text-sm">
              {success}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 p-4">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-200 rounded-xl" />
            <div className="h-10 w-full bg-slate-200 rounded-xl" />
            <div className="h-10 w-32 bg-slate-200 rounded-xl" />
          </div>
        ) : me ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-600">Name</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
              />
            </div>

            <div>
              <label className="text-sm text-slate-600">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </div>

            <button
              disabled={busy}
              className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm hover:bg-slate-800 disabled:opacity-60"
            >
              {busy ? "Saving..." : "Save"}
            </button>
          </form>
        ) : (
          <div className="text-slate-600">Belum login / user tidak ditemukan.</div>
        )}
      </div>
    </div>
  );
}
