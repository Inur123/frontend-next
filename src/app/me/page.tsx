"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { getToken, clearToken } from "@/src/lib/auth";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
};

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const token = getToken();
    if (!token) return router.push("/login");

    const res = await apiFetch("/auth/me", { token });
    setUser(res.data.user);
    setName(res.data.user.name);
    setEmail(res.data.user.email);
  }

  async function save() {
    const token = getToken();
    if (!token) return;

    await apiFetch("/auth/profile", {
      method: "PUT",
      token,
      body: { name, email },
    });

    setMsg("Profile berhasil diupdate");
    setEdit(false);
    load();
  }

  function logout() {
    clearToken();
    router.push("/login");
  }

  useEffect(() => {
    load();
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow">
      <h1 className="text-xl font-bold mb-4">Profile</h1>

      {edit ? (
        <>
          <input
            className="w-full border rounded px-3 py-2 mb-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full border rounded px-3 py-2 mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={save}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Simpan
          </button>
        </>
      ) : (
        <>
          <p className="mb-2">
            <b>Nama:</b> {user.name}
          </p>
          <p className="mb-4">
            <b>Email:</b> {user.email}
          </p>
          <button
            onClick={() => setEdit(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded mr-2"
          >
            Edit
          </button>
        </>
      )}

      <button
        onClick={logout}
        className="bg-red-600 text-white px-4 py-2 rounded mt-4"
      >
        Logout
      </button>

      {msg && <p className="text-green-600 mt-3">{msg}</p>}
    </div>
  );
}
