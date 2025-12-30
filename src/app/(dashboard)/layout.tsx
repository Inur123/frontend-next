"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, getToken } from "@/src/lib/auth";
import { useEffect } from "react";

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={[
        "block rounded-xl px-3 py-2 text-sm",
        active
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // protect basic: kalau belum login, lempar ke login
    const token = getToken();
    if (!token) router.push("/login");
  }, [router]);

  async function logout() {
    // kalau backend ada /auth/logout (protected), boleh dipanggil (optional)
    clearToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
          {/* Sidebar */}
          <aside className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <div className="mb-4">
              <div className="text-sm text-slate-500">Dashboard</div>
              <div className="font-semibold">Belajar Next</div>
            </div>

            <nav className="space-y-1">
              <NavItem href="/profile" label="Profile" />
              <NavItem href="/products" label="Products" />
            </nav>

            <button
              onClick={logout}
              className="mt-6 w-full rounded-xl border border-slate-300 py-2 text-sm hover:bg-slate-50"
            >
              Logout
            </button>
          </aside>

          {/* Main */}
          <main className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
