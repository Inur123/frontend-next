"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/src/lib/api";
import { setToken } from "@/src/lib/auth";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("Budi");
  const [email, setEmail] = useState("budi@mail.com");
  const [password, setPassword] = useState("secret123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: { name, email, password },
      });

      // ✅ asumsi backend return token
      const token = res?.data?.token;
      if (token) {
        setToken(token);
        router.push("/me");
      } else {
        // kalau register tidak return token, arahkan ke login
        router.push("/login");
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr("Register gagal");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h1>Register</h1>
      <p>
        Sudah punya akun? <Link href="/login">Login</Link>
      </p>

      <form onSubmit={onSubmit}>
        <label>Nama</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

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
          {loading ? "Loading..." : "Register"}
        </button>
      </form>

      {err ? <p style={{ marginTop: 12 }}>{err}</p> : null}
    </div>
  );
}
