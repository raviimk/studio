
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SystemStateProvider } from '@/hooks/useSystemState';
import { LayoutProvider } from '@/hooks/useLayout';
import { FirebaseProvider } from '@/firebase/provider';
import { ClientLayout } from './client-layout';

export const metadata = {
  title: 'ATIXE Diamond',
  description: 'Diamond Production Manager – Sarin + Laser Unified Tracker',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💠</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Montserrat:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseProvider>
            <SystemStateProvider>
                <LayoutProvider>
                    <ClientLayout>{children}</ClientLayout>
                    <Toaster />
                </LayoutProvider>
            </SystemStateProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
