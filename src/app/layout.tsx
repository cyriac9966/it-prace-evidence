import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evidencer IT práce",
  description: "Detailní evidence práce s auditním logem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className="antialiased">{children}</body>
    </html>
  );
}
