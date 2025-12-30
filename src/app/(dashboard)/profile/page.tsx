"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { getToken } from "@/src/lib/auth";

type MeUser = {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setError("");
    setSuccess("");
    setLoading(true);

    const token = getToken();
    if (!token) return;

    try {
      const res = await apiFetch("/auth/me", { token });
      const u = res.data.user as MeUser;
      setUser(u);
      setName(u.name);
      setEmail(u.email);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal load profile");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setError("");
    setSuccess("");

    const token = getToken();
    if (!token) return;

    try {
      await apiFetch("/auth/profile", {
        method: "PUT",
        token,
        body: { name, email },
      });

      setSuccess("Profile berhasil diupdate");
      setEditMode(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal update profile");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="text-slate-600">Loading...</div>;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Profile</h1>
          <p className="text-slate-600 text-sm mt-1">
            Lihat dan update data akun kamu.
          </p>
        </div>

        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditMode(false);
                if (user) {
                  setName(user.name);
                  setEmail(user.email);
                }
              }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={save}
              className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800"
            >
              Simpan
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Nama</div>
          {editMode ? (
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          ) : (
            <div className="mt-2 font-medium">{user?.name}</div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Email</div>
          {editMode ? (
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          ) : (
            <div className="mt-2 font-medium">{user?.email}</div>
          )}
        </div>
      </div>

      {(error || success) && (
        <div className="mt-4">
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
    </div>
  );
}
