import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lemenx Office",
  description: "Lead Management + Leave Application system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
