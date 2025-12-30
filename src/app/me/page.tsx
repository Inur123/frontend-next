"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { clearToken, getToken } from "@/src/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MePage() {
  type MeUser = {
    id: number;
    name: string;
    email: string;
    createdAt: string;
  };
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [err, setErr] = useState("");

  async function loadMe() {
    setErr("");
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const res = await apiFetch("/auth/me", { token });
    setMe(res.data.user);
  }

  useEffect(() => {
    loadMe().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logoutServer() {
    // optional: kalau backend kamu punya POST /auth/logout (protected)
    const token = getToken();
    if (!token) return;

    try {
      await apiFetch("/auth/logout", { method: "POST", token });
    } catch {
      // kalau gagal, tetap hapus token client
    }
    clearToken();
    router.push("/login");
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1>Me</h1>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={logoutServer} style={{ padding: 10 }}>
          Logout
        </button>
        <Link href="/" style={{ alignSelf: "center" }}>
          Home
        </Link>
      </div>

      {err ? <p style={{ marginTop: 12 }}>{err}</p> : null}
      {me ? (
        <pre style={{ marginTop: 12 }}>{JSON.stringify(me, null, 2)}</pre>
      ) : (
        <p style={{ marginTop: 12 }}>Loading...</p>
      )}
    </div>
  );
}
