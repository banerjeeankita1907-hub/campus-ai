import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CampusAI – Smart Campus Digital Twin',
  description: 'Real-time 3D IoT monitoring with on-device anomaly detection and predictive analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
