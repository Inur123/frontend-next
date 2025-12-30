import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-semibold">Belajar Express + Next</h1>
        <p className="text-slate-600 mt-1">
          Dashboard sederhana untuk auth & profile.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="flex-1 text-center rounded-xl bg-slate-900 text-white py-2.5 hover:bg-slate-800"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="flex-1 text-center rounded-xl border border-slate-300 py-2.5 hover:bg-slate-50"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
