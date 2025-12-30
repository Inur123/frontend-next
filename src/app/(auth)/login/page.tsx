"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { setToken } from "@/src/lib/auth";
import toast from "react-hot-toast";

type LoginResponse = {
  message: string;
  data: {
    user: { id: number; name: string; email: string };
    token: string;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) return toast.error("Email wajib diisi");
    if (!password.trim()) return toast.error("Password wajib diisi");

    setLoading(true);
    const toastId = toast.loading("Login...");

    try {
      const res = (await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
      })) as LoginResponse;

      const token = res?.data?.token;
      if (!token) throw new Error("Token tidak ditemukan dari response");

      setToken(token);
      toast.success("Login berhasil", { id: toastId });

      router.push("/profile");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Login gagal", { id: toastId });
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
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
              placeholder="contoh@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Password</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 text-white py-2.5 hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>

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
