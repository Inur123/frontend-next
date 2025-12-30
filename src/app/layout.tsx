export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body style={{ fontFamily: "system-ui", margin: 0 }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
