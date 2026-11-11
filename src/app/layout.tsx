import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RV MOVIES - Download Latest Movies",
  description: "Download high quality movies in 4K, 1080p, 720p and 480p.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="bg-animation" />
        <div className="flex min-h-screen flex-col relative z-10">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-white/5 py-10 text-center text-muted-foreground text-sm backdrop-blur-sm">
            © {new Date().getFullYear()} RV MOVIES. All rights reserved.
          </footer>
        </div>
      </body>
    </html>
  );
}