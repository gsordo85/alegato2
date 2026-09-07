import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALEGATO · Juristas por los Animales",
  description:
    "Aplicación para recibir, organizar y gestionar denuncias de maltrato animal en Colombia. Atención jurídica y seguimiento de casos.",
  applicationName: "ALEGATO",
  appleWebApp: { capable: true, title: "ALEGATO", statusBarStyle: "black-translucent" },
  manifest: undefined,
};

export const viewport: Viewport = {
  themeColor: "#047857",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased text-slate-100 selection:bg-emerald-400/30">
        {children}
      </body>
    </html>
  );
}
