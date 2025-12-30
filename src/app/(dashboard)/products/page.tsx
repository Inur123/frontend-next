"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { getToken } from "@/src/lib/auth";

type Product = {
  id: number;
  name: string;
  price: number;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ListProductsResponse = {
  message: string;
  data: { products: Product[] };
};

type CreateProductResponse = {
  message: string;
  data: { product: Product };
};

type UpdateProductResponse = {
  message: string;
  data: { product: Product };
};

// ✅ Skeleton component (inline)
function ProductSkeleton({ rows = 5 }: { rows?: number }) {
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

export default function ProductsPage() {
  // ✅ hydration guard
  const [mounted, setMounted] = useState(false);

  // ✅ token diambil setelah mount (bukan saat render)
  const [token, setToken] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // form create
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState("");

  // edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState<string>("");
  const [editDescription, setEditDescription] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ Number formatter
  const priceFormatter = useMemo(() => new Intl.NumberFormat("id-ID"), []);

  useEffect(() => {
    setMounted(true);
    setToken(getToken());
  }, []);

  const canCreate = useMemo(() => {
    const p = Number(price);
    return name.trim().length >= 2 && Number.isFinite(p) && p >= 0 && !busy;
  }, [name, price, busy]);

  async function load() {
    setError("");
    setLoading(true);

    try {
      const res = (await apiFetch<ListProductsResponse>("/products")) as ListProductsResponse;
      setProducts(res.data.products);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ REALTIME SSE
  useEffect(() => {
    const BASE = process.env.NEXT_PUBLIC_API_BASE;
    if (!BASE) return;

    const es = new EventSource(`${BASE}/products/stream`);

    const onChanged = () => load();

    es.addEventListener("products_changed", onChanged);

    return () => {
      es.removeEventListener("products_changed", onChanged);
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(p: Product) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(String(p.price));
    setEditDescription(p.description ?? "");
    setSuccess("");
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditPrice("");
    setEditDescription("");
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Harus login untuk membuat product");
      return;
    }

    const p = Number(price);
    if (!name.trim() || !Number.isFinite(p) || p < 0) {
      setError("Nama minimal 2 karakter, harga harus angka >= 0");
      return;
    }

    setBusy(true);
    try {
      await apiFetch<CreateProductResponse>("/products", {
        method: "POST",
        token,
        body: {
          name: name.trim(),
          price: p,
          description: description.trim() ? description.trim() : undefined,
        },
      });

      setName("");
      setPrice("");
      setDescription("");
      setSuccess("Product berhasil dibuat");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal membuat product");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: number) {
    setError("");
    setSuccess("");

    if (!token) {
      setError("Harus login untuk update product");
      return;
    }

    const p = Number(editPrice);
    if (!editName.trim() || !Number.isFinite(p) || p < 0) {
      setError("Nama minimal 2 karakter, harga harus angka >= 0");
      return;
    }

    setBusy(true);
    try {
      await apiFetch<UpdateProductResponse>(`/products/${id}`, {
        method: "PUT",
        token,
        body: {
          name: editName.trim(),
          price: p,
          description: editDescription.trim() ? editDescription.trim() : null,
        },
      });

      setSuccess("Product berhasil diupdate");
      cancelEdit();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal update product");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(id: number) {
    setError("");
    setSuccess("");

    if (!token) {
      setError("Harus login untuk delete product");
      return;
    }

    const ok = confirm("Yakin hapus product ini?");
    if (!ok) return;

    setBusy(true);
    try {
      await apiFetch(`/products/${id}`, {
        method: "DELETE",
        token,
      });

      setSuccess("Product berhasil dihapus");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal delete product");
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) {
    return <div className="text-slate-600">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-slate-600 text-sm mt-1">CRUD sederhana pakai API Express.</p>
        </div>
      </div>

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
        <h2 className="font-semibold">Tambah Product</h2>

        <form onSubmit={createProduct} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="text-xs text-slate-500">Name</label>
            <input
              disabled={busy}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kopi Susu"
            />
          </div>

          <div className="md:col-span-1">
            <label className="text-xs text-slate-500">Price</label>
            <input
              disabled={busy}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="20000"
              inputMode="numeric"
            />
          </div>

          <div className="md:col-span-1">
            <label className="text-xs text-slate-500">Description (optional)</label>
            <input
              disabled={busy}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enak"
            />
          </div>

          <div className="md:col-span-3">
            <button
              disabled={!canCreate}
              className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? "Processing..." : "Tambah"}
            </button>

            {!token && (
              <span className="ml-3 text-sm text-slate-500">
                * Login dulu untuk create/update/delete
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Daftar Products</h2>
            <p className="text-sm text-slate-600">
              {loading ? "Loading..." : `${products.length} item`}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

        {/* ✅ Skeleton list */}
        {loading ? (
          <ProductSkeleton rows={5} />
        ) : (
          <div className="divide-y divide-slate-200">
            {products.map((p) => {
              const isEditing = editingId === p.id;

              return (
                <div key={p.id} className="p-4">
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-1">
                        <label className="text-xs text-slate-500">Name</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>

                      <div className="md:col-span-1">
                        <label className="text-xs text-slate-500">Price</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          inputMode="numeric"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs text-slate-500">Description</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                        />
                      </div>

                      <div className="md:col-span-4 flex gap-2">
                        <button
                          onClick={() => saveEdit(p.id)}
                          disabled={busy || !token}
                          className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-60"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={busy}
                          className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          {p.name}{" "}
                          <span className="text-slate-500 font-normal">#{p.id}</span>
                        </div>
                        <div className="text-sm text-slate-600">
                          Rp {priceFormatter.format(p.price)}
                          {p.description ? ` • ${p.description}` : ""}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(p)}
                          disabled={!token || busy}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          disabled={!token || busy}
                          className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {products.length === 0 && (
              <div className="p-4 text-slate-600">Belum ada product.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
