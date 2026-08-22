"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "./../context/CartContext";
import { Product } from "./../types/product";


import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
const router = useRouter();
  // Check login status
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        setIsLoggedIn(response.ok);
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkLogin();
  }, []);

  const handleAddToCart = () => {
    // Login nahi hai
    if (!isLoggedIn) {
      
      router.push("/components/login");
      return;
    }

    // Login hai
    addToCart({
      id: product.id,
      name: product.name,
      image: product.image,
      quantity: 1,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Product Image */}
      <div className="relative w-full h-56">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-contain p-4"
        />
      </div>

      {/* Product Info */}
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">
          {product.name}
        </h3>

        <button
          onClick={handleAddToCart}
          disabled={checkingAuth}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-md font-medium transition-colors"
        >
          {checkingAuth ? "Checking..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}