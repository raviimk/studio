import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blank Project",
  description: "A fresh start",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}