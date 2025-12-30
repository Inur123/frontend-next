"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { getToken } from "@/src/lib/auth";
import toast from "react-hot-toast";

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
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState<string>("");
  const [editDescription, setEditDescription] = useState("");

  const priceFormatter = useMemo(() => new Intl.NumberFormat("id-ID"), []);

  useEffect(() => {
    setMounted(true);
    setToken(getToken());
  }, []);

  const canCreate = useMemo(() => {
    const p = Number(price);
    return name.trim().length >= 2 && Number.isFinite(p) && p >= 0 && !busy;
  }, [name, price, busy]);

  async function load(opts?: { silent?: boolean }) {
    // ✅ silent refresh: jangan bikin skeleton kedip
    if (!opts?.silent) setLoading(true);

    try {
      const res = (await apiFetch<ListProductsResponse>("/products")) as ListProductsResponse;
      setProducts(res.data.products);
    } catch (e: unknown) {
      if (!opts?.silent) toast.error(e instanceof Error ? e.message : "Gagal load products");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }

  useEffect(() => {
    load(); // initial load: skeleton muncul
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const BASE = process.env.NEXT_PUBLIC_API_BASE;
    if (!BASE) return;

    const es = new EventSource(`${BASE}/products/stream`);
    const onChanged = () => load({ silent: true });

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
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditPrice("");
    setEditDescription("");
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();

    if (!token) return toast.error("Harus login untuk membuat product");

    const p = Number(price);
    if (!name.trim() || !Number.isFinite(p) || p < 0) {
      return toast.error("Nama minimal 2 karakter, harga harus angka >= 0");
    }

    setBusy(true);
    const toastId = toast.loading("Membuat product...");

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

      toast.success("Product berhasil dibuat", { id: toastId });
      await load({ silent: true });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal membuat product", { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: number) {
    if (!token) return toast.error("Harus login untuk update product");

    const p = Number(editPrice);
    if (!editName.trim() || !Number.isFinite(p) || p < 0) {
      return toast.error("Nama minimal 2 karakter, harga harus angka >= 0");
    }

    setBusy(true);
    const toastId = toast.loading("Menyimpan perubahan...");

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

      toast.success("Product berhasil diupdate", { id: toastId });
      cancelEdit();
      await load({ silent: true });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal update product", { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(id: number) {
    if (!token) return toast.error("Harus login untuk delete product");

    const ok = confirm("Yakin hapus product ini?");
    if (!ok) return;

    setBusy(true);
    const toastId = toast.loading("Menghapus product...");

    try {
      await apiFetch(`/products/${id}`, { method: "DELETE", token });
      toast.success("Product berhasil dihapus", { id: toastId });
      await load({ silent: true });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal delete product", { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  // ✅ tidak ada Loading... text, pakai skeleton saja
  if (!mounted) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="h-5 w-28 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-40 bg-slate-200 rounded mt-2 animate-pulse" />
        </div>
        <ProductSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-slate-600 text-sm mt-1">CRUD sederhana pakai API Express.</p>
        </div>
      </div>

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
            {/* ✅ no "Loading..." text */}
            <p className="text-sm text-slate-600">
              {loading ? "\u00A0" : `${products.length} item`}
            </p>
          </div>

          <button
            onClick={() => load()} // refresh manual boleh skeleton
            disabled={loading}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

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
                          {p.name} <span className="text-slate-500 font-normal">#{p.id}</span>
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
