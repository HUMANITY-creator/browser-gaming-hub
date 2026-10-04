import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GameForge AI",
  description: "A browser gaming hub with an AI game coach.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
