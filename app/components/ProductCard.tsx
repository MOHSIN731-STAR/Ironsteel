"use client";

import Image from "next/image";
import { useCart } from "./../context/CartContext";
import { Product } from "./../types/product";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      <div className="relative h-64 bg-gray-100">
        <Image
          src={typeof product === "string" ? product : product.image}
          alt={typeof product === "string" ? "Product Image" : product.name}
          fill
          className="object-contain p-4"
        />
      </div>

      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">
          {typeof product === "string" ? "Product Name" : product.name}
        </h3>
        {/* <p className="text-2xl font-bold text-emerald-700 mb-3">
          Rs. {product.price.toLocaleString()}
        </p> */}

        <button
       onClick={() =>
  addToCart({
    id: product.id,
    name: product.name,
    image: product.image,
    quantity: 1,
  })
}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-medium transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}