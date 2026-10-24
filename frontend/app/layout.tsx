import type { Metadata, Viewport } from 'next';
import './globals.css';
import PwaRegister from './components/PwaRegister';

export const metadata: Metadata = {
  title: 'NOTE OS — your thinking, in one place',
  description: 'A calm workspace for notes, ideas, and GPT-powered recall.',
  applicationName: 'NOTE OS',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'NOTE OS',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: '/icons/noteos.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#6f927d',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
