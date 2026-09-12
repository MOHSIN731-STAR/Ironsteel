
"use client";

import { useEffect, useState } from "react";
import ProductCard from "./../components/ProductCard";
import { Product } from "./../types/product";
import { useRouter } from "next/navigation";
import Calculator from "./../components/Calculator";

const products: Product[] = [
  { id: 1, name: "DGسیمنٹ", image: "/DGسیمنٹ.png" },
  { id: 2, name: "پاکستان سیمنٹ", image: "/pk.png" },
  { id: 3, name: "70×70 ٹی یار", image: "/70×70 ٹی یار.png" },
  { id: 4, name: "75×75 ٹی یار", image: "/70×70 ٹی یار.png" },
  { id: 5, name: "گاڈرمغل", image: "/گاڈرمغل.png" },
  { id: 6, name: "شاپر", image: "/shapper.jpeg" },
  { id: 7, name: "ٹائل 10انچ والی", image: "/ٹائل 10انچ والی.png" },
  { id: 8, name: "ٹائل فٹ والی", image: "/ٹائل فٹ والی.png" },
  { id: 9, name: "سریا Azmat Gold", image: "/سپریم سریا.png" },
  { id: 10, name: "MOIZ سریا", image: "/سپریم سریا.png" },
  { id: 11, name: "تار", image: "/tar.png" },
  { id: 12, name: "پانی پائپ", image: "/watarpip.png" },
  { id: 13, name: "بالٹی", image: "/bati.jpeg" },
  { id: 14, name: "ڈبہ", image: "/daba.jpeg" },
  { id: 15, name: "موٹی بجری", image: "/motibajri.jpeg" },
  { id: 16, name: "باریک بجری", image: "/barikbajri.jpeg" },
  { id: 17, name: "پلاسٹک دروازہ", image: "/door.png" },
  { id: 18, name: "فوم", image: "/foam.png" },
  { id: 19, name: "رینگ", image: "/RING.png" },
  { id: 20, name: "white cement", image: "/white_cement.jpg" },
  { id: 21, name: "جالی ریت", image: "/jali.jpg" },
  { id: 22, name: "بلیڈ", image: "/blades.webp" },
  { id: 23, name: "تار برش", image: "/barish.png" },
  { id: 24, name: "لوہا بھٹل", image: "/lohe_batil.png" },
  { id: 25, name: "پلاسٹک بھٹل", image: "/plastic_batil.png" },
];

interface Stocks {
  [key: number]: number;
}

export default function Products() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState<Stocks>({});

  const router = useRouter();

  /* ---------------- LOGIN CHECK ---------------- */

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
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  /* ---------------- STOCK LOAD + PRODUCT REGISTER ---------------- */

  useEffect(() => {
    const loadStocks = () => {
      let savedStocks: Stocks = {};

      const saved = localStorage.getItem("productStocks");

      if (saved) {
        try {
          savedStocks = JSON.parse(saved);
        } catch (error) {
          console.error("Invalid stock data");
          savedStocks = {};
        }
      }

      /*
       * Automatically register every product.
       *
       * Existing stock will NOT be changed.
       * New product gets stock = 0.
       */

      let changed = false;

      products.forEach((product) => {
        if (
          savedStocks[product.id] === undefined
        ) {
          savedStocks[product.id] = 0;
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem(
          "productStocks",
          JSON.stringify(savedStocks)
        );
      }

      setStocks(savedStocks);
    };

    // Initial load
    loadStocks();

    // Same tab update
    window.addEventListener(
      "stockUpdated",
      loadStocks
    );

    // Other tab update
    window.addEventListener(
      "storage",
      loadStocks
    );

    return () => {
      window.removeEventListener(
        "stockUpdated",
        loadStocks
      );

      window.removeEventListener(
        "storage",
        loadStocks
      );
    };
  }, []);

  /* ---------------- PRODUCT CLICK ---------------- */

  const handleProductClick = (
    product: Product
  ) => {
    if (!isLoggedIn) {
      router.push("/components/login");
      return;
    }

    console.log(
      "Product clicked:",
      product
    );
  };

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        Loading...
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div>

      <Calculator />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">

        {products.map((product) => (

          <div
            key={product.id}
            onClick={() =>
              handleProductClick(product)
            }
            className="cursor-pointer"
          >

            <div className="relative">

              {/* STOCK */}

              <div
                className={`absolute top-2 right-2 z-20 px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                  (stocks[product.id] ?? 0) > 0
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                Stock:{" "}
                {stocks[product.id] ?? 0}
              </div>

              <ProductCard
                product={product}
              />

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}
