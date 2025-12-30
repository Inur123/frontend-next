"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/src/lib/api";
import { setToken } from "@/src/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("budi@mail.com");
  const [password, setPassword] = useState("secret123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      const token = res?.data?.token;
      if (!token) throw new Error("Token tidak ditemukan dari response login");

      setToken(token);
      router.push("/me");
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr("Login gagal");
      }
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h1>Login</h1>
      <p>
        Belum punya akun? <Link href="/register">Register</Link>
      </p>

      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

        <button disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "Loading..." : "Login"}
        </button>
      </form>

      {err ? <p style={{ marginTop: 12 }}>{err}</p> : null}
    </div>
  );
}
