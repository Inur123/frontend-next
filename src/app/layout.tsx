import "./globals.css";
import { Toaster } from "react-hot-toast";

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