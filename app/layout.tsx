import "./globals.css";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iron Store",
  icons: {
    icon: "/bismallah.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        
        <CartProvider>
          <Navbar />
          {children}
        </CartProvider>
        
      </body>
    </html>
  );
}