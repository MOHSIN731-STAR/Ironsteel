"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
interface Product {
  id: number;
  name: string;
  image: string;
}

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

export default function StockInput() {
  const [stocks, setStocks] = useState<Stocks>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ---------------- LOGIN CHECK ---------------- */

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        setIsLoggedIn(response.ok);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  /* ---------------- STOCK LOAD ---------------- */

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
       * Existing stock will NOT be changed.
       * New product gets stock = 0.
       */

      let changed = false;

      products.forEach((product) => {
        if (savedStocks[product.id] === undefined) {
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

  /* ---------------- STOCK CHANGE ---------------- */

  const handleStockChange = (
    productId: number,
    value: string
  ) => {
    // Login nahi hai to update nahi hoga
    if (!isLoggedIn) {
      return;
    }

    const newStock =
      value === "" ? 0 : Number(value);

    const updatedStocks = {
      ...stocks,
      [productId]: newStock,
    };

    setStocks(updatedStocks);

    localStorage.setItem(
      "productStocks",
      JSON.stringify(updatedStocks)
    );

    // Products page ko update karne ke liye
    window.dispatchEvent(
      new Event("stockUpdated")
    );
  };

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-gray-500">
          Loading...
        </p>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}

        <div className="bg-white rounded-2xl shadow-md p-5 mb-6">

          <h1 className="text-2xl font-bold text-gray-800">
            Product Stock
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Yahan se product ka stock update karein.
          </p>

          {!isLoggedIn && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm font-medium">
              🔒 Stock enter karne ke liye pehle login karein.
            </div>
          )}

          {isLoggedIn && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-600 rounded-lg px-4 py-3 text-sm font-medium">
              ✓ Login successful. Stock update kar sakte hain.
            </div>
          )}

        </div>

        {/* PRODUCTS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {products.map((product) => (

            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border p-4"
            >

              <div className="flex items-center gap-4">

                {/* PRODUCT IMAGE */}

                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">

                  <Image
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    width={20}
                    height={20}
                  />

                </div>

                {/* PRODUCT NAME + INPUT */}

                <div className="flex-1">

                  <h2 className="font-semibold text-gray-800 text-sm mb-2">
                    {product.name}
                  </h2>

                  <input
                    type="number"
                    min="0"
                    value={stocks[product.id] ?? 0}
                    disabled={!isLoggedIn}
                    onChange={(e) =>
                      handleStockChange(
                        product.id,
                        e.target.value
                      )
                    }
                    className={`
                      w-full
                      border
                      rounded-lg
                      px-3
                      py-2
                      outline-none
                      ${
                        isLoggedIn
                          ? "bg-white border-gray-300 focus:ring-2 focus:ring-blue-500"
                          : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      }
                    `}
                    placeholder={
                      isLoggedIn
                        ? "Enter Stock"
                        : "Login Required"
                    }
                  />

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>
    </div>
  );
}