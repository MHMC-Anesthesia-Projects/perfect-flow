import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Perfect Journey | Perioperative Patient Journey & OR Tracker',
  description: 'Enterprise clinical command center tracking patients seamlessly across Pre-Op, Intra-Op, PACU, and Phase II Recovery.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="whiteboard">
      <body>{children}</body>
    </html>
  );
}
