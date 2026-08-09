import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Telemetry Control",
  description: "Real-time automotive diagnostic telemetry dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
