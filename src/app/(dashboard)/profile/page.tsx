"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { getToken } from "@/src/lib/auth";
import toast from "react-hot-toast";

type User = {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
};

type MeResponse = {
  message: string;
  data: { user: User };
};

type UpdateProfileResponse = {
  message: string;
  data: { user: User };
};

function ProfileSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1">
              <div className="h-4 w-44 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-72 bg-slate-200 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-slate-200 rounded-xl" />
              <div className="h-8 w-20 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    setMounted(true);
    setToken(getToken());
  }, []);

  async function loadMe(opts?: { silent?: boolean }) {
    // ✅ silent = refresh background (tanpa skeleton kedip)
    if (!opts?.silent) setLoading(true);

    try {
      const t = getToken();
      if (!t) throw new Error("Token tidak ditemukan. Silakan login.");

      const res = (await apiFetch<MeResponse>("/auth/me", { token: t })) as MeResponse;

      setMe(res.data.user);
      setName(res.data.user.name);
      setEmail(res.data.user.email);
    } catch (e: unknown) {
      setMe(null);
      if (!opts?.silent) toast.error(e instanceof Error ? e.message : "Gagal load profile");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }

  // load pertama (skeleton tampil)
  useEffect(() => {
    if (!mounted) return;
    loadMe(); // ❗ bukan silent → skeleton muncul hanya sekali awal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // SSE realtime (silent refresh, tanpa skeleton/tanpa toast)
  useEffect(() => {
    const BASE = process.env.NEXT_PUBLIC_API_BASE;
    if (!BASE) return;
    if (!token) return;

    const es = new EventSource(`${BASE}/products/stream?token=${encodeURIComponent(token)}`);

    const onProfileChanged = async (ev: MessageEvent) => {
      try {
        const payload = JSON.parse(ev.data || "{}") as { userId?: number };
        if (!me?.id || payload.userId !== me.id) return;

        await loadMe({ silent: true });
      } catch {
        await loadMe({ silent: true });
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

    if (!token) return toast.error("Token tidak ada. Silakan login.");
    if (name.trim().length < 2) return toast.error("Nama minimal 2 karakter");
    if (!email.trim().includes("@")) return toast.error("Email tidak valid");

    setBusy(true);
    const toastId = toast.loading("Menyimpan profile...");

    try {
      const res = (await apiFetch<UpdateProfileResponse>("/auth/profile", {
        method: "PUT",
        token,
        body: { name: name.trim(), email: email.trim() },
      })) as UpdateProfileResponse;

      setMe(res.data.user);
      toast.success("Profile berhasil disimpan", { id: toastId });

      // sync ulang tanpa skeleton
      await loadMe({ silent: true });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal update profile", { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  // ✅ Tidak ada "Loading..." text sebelum mounted → tampilkan skeleton saja
  if (!mounted) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="h-5 w-28 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-40 bg-slate-200 rounded mt-2 animate-pulse" />
        </div>
        <ProfileSkeleton rows={2} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Profile</h1>
          <p className="text-slate-600 text-sm mt-1">Edit data akun kamu.</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="font-semibold">Data Akun</div>
          {/* ✅ no "Loading..." text */}
          <div className="text-sm text-slate-600">{loading ? "\u00A0" : me ? `User #${me.id}` : "Tidak ada data"}</div>
        </div>

        {loading ? (
          <ProfileSkeleton rows={2} />
        ) : me ? (
          <div className="p-4">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-sm text-slate-600">Name</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={busy}
                />
              </div>

              <div>
                <label className="text-sm text-slate-600">Email</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
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
          </div>
        ) : (
          <div className="p-4 text-slate-600">
            Kamu belum login atau user tidak ditemukan. Silakan login dulu.
          </div>
        )}
      </div>
    </div>
  );
}
