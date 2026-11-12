import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
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
    <html lang="es" className={poppins.variable}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
