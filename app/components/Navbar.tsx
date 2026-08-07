"use client";

import Link from "next/link";
// import { useCart } from "@/context/CartContext";
import { useCart } from "./../context/CartContext";
import CartCount from "./CartCount";
import { JSX } from "react";

export default function Navbar(): JSX.Element {
  const { cartCount } = useCart();

  return (
    <nav className="bg-blue-700 text-white p-3 sticky top-0 z-10 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-lg font-bold">
          Bismillah
        </Link>
        <Link href="/components/stationery" className="hover:text-shadow-blue-400">
          Stationary
        </Link>

        <div className="flex gap-8 items-center">
            <Link href="/components/customer" className="hover:text-shadow-blue-400">
            khata customer enter
          </Link>
            <Link href="/components/orders" className="hover:text-shadow-blue-400">
            khata customer data
          </Link>
          <Link href="/components/walking" className="hover:text-shadow-blue-400">
            walking customer
          </Link>
          <Link href="/dashboard" className="hover:text-shadow-blue-400">
            Products
          </Link>
 <Link href="/components/register" className="hover:text-shadow-blue-400">
          register
          </Link>
          <Link href="/cart" className="relative hover:text-shadow-blue-400">
            Cart
            <CartCount count={cartCount} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
