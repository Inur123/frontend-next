// src/app/products/page.tsx
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
  userId?: number;
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

// ✅ Format input jadi rupiah (20.000)
function formatRupiahInput(value: string) {
  const numeric = value.replace(/\D/g, "");
  if (!numeric) return "";
  return new Intl.NumberFormat("id-ID").format(Number(numeric));
}

// ✅ Parse input rupiah jadi number murni (20.000 -> 20000)
function parseRupiahInput(value: string) {
  const numeric = value.replace(/\D/g, "");
  return numeric ? Number(numeric) : 0;
}

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

  // ✅ Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const priceFormatter = useMemo(() => new Intl.NumberFormat("id-ID"), []);

  useEffect(() => {
    setMounted(true);
    setToken(getToken());
  }, []);

  const canCreate = useMemo(() => {
    const p = parseRupiahInput(price);
    return name.trim().length >= 2 && Number.isFinite(p) && p >= 0 && !busy;
  }, [name, price, busy]);

  // ✅ total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(products.length / pageSize));
  }, [products.length, pageSize]);

  // ✅ potong data sesuai page
  const pagedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return products.slice(start, start + pageSize);
  }, [products, page, pageSize]);

  // ✅ kalau delete/create bikin jumlah halaman turun → pastikan page valid
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function load(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);

    try {
      const t = getToken();
      if (!t) {
        setProducts([]);
        return;
      }

      const res = await apiFetch<ListProductsResponse>("/products", { token: t });
      setProducts(res.data.products);
    } catch (e: unknown) {
      if (!opts?.silent) toast.error(e instanceof Error ? e.message : "Gagal load products");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SSE realtime
  useEffect(() => {
    const BASE = process.env.NEXT_PUBLIC_API_BASE;
    if (!BASE) return;

    const t = getToken();
    if (!t) return;

    const es = new EventSource(`${BASE}/products/stream?token=${encodeURIComponent(t)}`);
    const onChanged = () => load({ silent: true });

    es.addEventListener("products_changed", onChanged);

    return () => {
      es.removeEventListener("products_changed", onChanged);
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function startEdit(p: Product) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(formatRupiahInput(String(p.price)));
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

    const t = getToken();
    if (!t) return toast.error("Harus login untuk membuat product");

    const p = parseRupiahInput(price);
    if (!name.trim() || !Number.isFinite(p) || p < 0) {
      return toast.error("Nama minimal 2 karakter, harga harus angka >= 0");
    }

    setBusy(true);
    const toastId = toast.loading("Membuat product...");
    try {
      await apiFetch<CreateProductResponse>("/products", {
        method: "POST",
        token: t,
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
      setPage(1); // ✅ balik ke page 1 biar kelihatan yg baru (optional)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal membuat product", { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: number) {
    const t = getToken();
    if (!t) return toast.error("Harus login untuk update product");

    const p = parseRupiahInput(editPrice);
    if (!editName.trim() || !Number.isFinite(p) || p < 0) {
      return toast.error("Nama minimal 2 karakter, harga harus angka >= 0");
    }

    setBusy(true);
    const toastId = toast.loading("Menyimpan perubahan...");

    try {
      await apiFetch<UpdateProductResponse>(`/products/${id}`, {
        method: "PUT",
        token: t,
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
    const t = getToken();
    if (!t) return toast.error("Harus login untuk delete product");

    const ok = confirm("Yakin hapus product ini?");
    if (!ok) return;

    setBusy(true);
    const toastId = toast.loading("Menghapus product...");

    try {
      await apiFetch(`/products/${id}`, { method: "DELETE", token: t });
      toast.success("Product berhasil dihapus", { id: toastId });
      await load({ silent: true });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal delete product", { id: toastId });
    } finally {
      setBusy(false);
    }
  }

  // ✅ helper untuk render tombol nomor halaman (max 5)
  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

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
          <p className="text-slate-600 text-sm mt-1">CRUD sederhana pakai API Express (per user).</p>
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
              onChange={(e) => setPrice(formatRupiahInput(e.target.value))}
              placeholder="20.000"
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
                * Login dulu untuk melihat & membuat product
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="font-semibold">Daftar Products</h2>
            <p className="text-sm text-slate-600">
              {loading ? "\u00A0" : `${products.length} item • Page ${page} of ${totalPages}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 px-2 py-2 text-sm"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {loading ? (
          <ProductSkeleton rows={pageSize} />
        ) : (
          <div className="divide-y divide-slate-200">
            {pagedProducts.map((p) => {
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
                          onChange={(e) => setEditPrice(formatRupiahInput(e.target.value))}
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
              <div className="p-4 text-slate-600">
                {token ? "Belum ada product." : "Login dulu untuk melihat product kamu."}
              </div>
            )}

            {/* ✅ Pagination Controls */}
            {products.length > 0 && (
              <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-slate-600">
                  Showing {(page - 1) * pageSize + 1} -{" "}
                  {Math.min(page * pageSize, products.length)} of {products.length}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                  >
                    Prev
                  </button>

                  {pageNumbers.map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        n === page
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
