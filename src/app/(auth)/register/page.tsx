"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { setToken } from "@/src/lib/auth";
import toast from "react-hot-toast";

type RegisterResponse = {
  message: string;
  data: {
    user: { id: number; name: string; email: string };
    token?: string;
  };
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (name.trim().length < 2) return toast.error("Nama minimal 2 karakter");
    if (!email.trim()) return toast.error("Email wajib diisi");
    if (password.trim().length < 6) return toast.error("Password minimal 6 karakter");

    setLoading(true);
    const toastId = toast.loading("Membuat akun...");

    try {
      const res = (await apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        body: { name: name.trim(), email: email.trim(), password },
      })) as RegisterResponse;

      const token = res?.data?.token;

      if (token) {
        setToken(token);
        toast.success("Register berhasil", { id: toastId });
        router.push("/profile");
      } else {
        toast.success("Register berhasil. Silakan login.", { id: toastId });
        router.push("/login");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Register gagal", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Register</h1>
          <p className="text-slate-600 mt-1">Buat akun baru.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-600">Nama</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
              placeholder="Nama kamu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

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
              placeholder="minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 text-white py-2.5 hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Register"}
          </button>
        </form>

        <p className="text-sm text-slate-600 mt-5">
          Sudah punya akun?{" "}
          <Link className="text-slate-900 font-medium" href="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
