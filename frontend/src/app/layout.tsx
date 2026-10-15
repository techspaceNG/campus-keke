import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Federal College of Education (Technical) Bichi - Campus Keke Service',
  description: 'Official Campus Tricycle Transit & Ticket Management System for Federal College of Education (Technical) Bichi. Simple. Fast. Campus rides.',
  icons: {
    icon: [
      { url: '/logo.png?v=3', type: 'image/png' },
      { url: '/icon.png?v=3', type: 'image/png' },
      { url: '/favicon.ico?v=3' },
    ],
    shortcut: '/logo.png?v=3',
    apple: '/logo.png?v=3',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/logo.png?v=3" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />
        <link rel="apple-touch-icon" href="/logo.png?v=3" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
