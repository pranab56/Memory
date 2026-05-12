import type { Metadata, Viewport } from 'next';
import { DM_Sans, Instrument_Serif } from 'next/font/google';
import './globals.css';

import { ReduxProvider } from '@/components/providers/ReduxProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0a0f',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: 'Media Vault — Admin Dashboard',
  description: 'Professional media upload and management dashboard',
};

const fontSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const fontSerif = Instrument_Serif({ subsets: ['latin'], variable: '--font-serif', display: 'swap', weight: '400' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontSerif.variable} antialiased`}>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
