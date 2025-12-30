import "./globals.css";
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: {
    default: "Belajar Next Dashboard",
    template: "%s • Belajar Next Dashboard",
  },
  description: "Dashboard sederhana untuk belajar Next.js + Express API",
  icons: {
    icon: "/vercel.svg",          // default favicon
    shortcut: "/vercel.svg",
    apple: "/vercel.svg" // optional untuk iOS
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* ✅ Toast global */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 2000,
            style: {
              borderRadius: "12px",
              background: "#0f172a",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}