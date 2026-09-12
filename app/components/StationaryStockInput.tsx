"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { stationaryProducts } from "./../types/stationaryProduct";

interface Stocks {
  [key: number]: number;
}

export default function StationaryStockInput() {
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

      const saved = localStorage.getItem("stationaryStocks");

      if (saved) {
        try {
          savedStocks = JSON.parse(saved);
        } catch (error) {
          console.error(
            "Invalid stationary stock data"
          );

          savedStocks = {};
        }
      }

      /*
       * Automatically register every
       * stationary product.
       *
       * Existing stock safe rahega.
       * New product = 0
       */

      let changed = false;

      stationaryProducts.forEach((product) => {
        if (savedStocks[product.id] === undefined) {
          savedStocks[product.id] = 0;
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem(
          "stationaryStocks",
          JSON.stringify(savedStocks)
        );
      }

      setStocks(savedStocks);
    };

    // Initial load
    loadStocks();

    // Same tab update
    window.addEventListener(
      "stationaryStockUpdated",
      loadStocks
    );

    // Other tab update
    window.addEventListener(
      "storage",
      loadStocks
    );

    return () => {
      window.removeEventListener(
        "stationaryStockUpdated",
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
    if (!isLoggedIn) {
      return;
    }

    const newStock =
      value === "" ? 0 : Number(value);

    if (Number.isNaN(newStock)) {
      return;
    }

    if (newStock < 0) {
      return;
    }

    const updatedStocks = {
      ...stocks,
      [productId]: newStock,
    };

    setStocks(updatedStocks);

    localStorage.setItem(
      "stationaryStocks",
      JSON.stringify(updatedStocks)
    );

    /*
     * Stationary products page ko
     * immediately update karega
     */

    window.dispatchEvent(
      new Event("stationaryStockUpdated")
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
            Stationary Product Stock
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Yahan se stationary product ka stock update karein.
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

          {stationaryProducts.map((product) => (

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
                    width={80}
                    height={80}
                    className="w-full h-full object-contain"
                  />

                </div>

                {/* NAME + INPUT */}

                <div className="flex-1 min-w-0">

                  <h2 className="font-semibold text-gray-800 text-sm mb-2">
                    {product.name}
                  </h2>

                  <input
                    type="number"
                    min="0"
                    step="any"
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