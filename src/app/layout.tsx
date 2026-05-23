import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YP | Catálogo de Moda",
  description:
    "Descubre nuestra colección exclusiva de prendas confeccionadas con amor y dedicación. Catálogo oficial de YP Modas.",
  keywords: ["moda", "ropa", "catálogo", "vestidos", "confección", "YP"],
  openGraph: {
    title: "YP | Catálogo de Moda",
    description: "Descubre nuestra colección exclusiva de prendas.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
