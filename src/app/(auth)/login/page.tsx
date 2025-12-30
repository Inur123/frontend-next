"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { setToken } from "@/src/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      const token = res?.data?.token;
      if (!token) throw new Error("Token tidak ditemukan dari response");

      setToken(token);
      router.push("/profile");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Login</h1>
          <p className="text-slate-600 mt-1">Masuk untuk membuka dashboard.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-600">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              placeholder="contoh@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Password</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 text-white py-2.5 hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>

        {err && <p className="text-red-600 text-sm mt-3">{err}</p>}

        <p className="text-sm text-slate-600 mt-5">
          Belum punya akun?{" "}
          <Link className="text-slate-900 font-medium" href="/register">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
