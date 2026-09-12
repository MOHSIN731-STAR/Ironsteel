"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { products } from "../../types/product";
import Link from "next/link";

interface Stocks {
  [key: number]: number;
}

export default function StockInput() {
  const [stocks, setStocks] = useState<Stocks>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Save button states
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  /* ---------------- DATABASE STOCK LOAD ---------------- */

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const response = await fetch("/api/product-stock", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load stocks");
        }

        const data = await response.json();

        const stockMap: Stocks = {};

        /*
         * Sab products ka default stock 0
         */
        products.forEach((product) => {
          stockMap[product.id] = 0;
        });

        /*
         * PostgreSQL se stock
         */
        data.forEach(
          (item: {
            productId: number;
            stock: number;
          }) => {
            stockMap[item.productId] = Number(
              item.stock
            );
          }
        );

        setStocks(stockMap);
      } catch (error) {
        console.error("Stock load error:", error);

        /*
         * API fail hone par
         * default stock 0
         */
        const defaultStocks: Stocks = {};

        products.forEach((product) => {
          defaultStocks[product.id] = 0;
        });

        setStocks(defaultStocks);
      }
    };

    // Initial load
    loadStocks();

    /*
     * Products page ya kisi aur component
     * se stock update hone par reload
     */
    window.addEventListener(
      "stockUpdated",
      loadStocks
    );

    return () => {
      window.removeEventListener(
        "stockUpdated",
        loadStocks
      );
    };
  }, []);

  /* ---------------- STOCK INPUT CHANGE ---------------- */

  const handleStockChange = (
    productId: number,
    value: string
  ) => {
    if (!isLoggedIn) {
      return;
    }

    const newStock =
      value === "" ? 0 : Number(value);

    /*
     * Invalid number
     */
    if (Number.isNaN(newStock)) {
      return;
    }

    /*
     * Negative stock allowed nahi
     */
    if (newStock < 0) {
      return;
    }

    /*
     * Sirf state update hoga.
     *
     * Database mein abhi save nahi hoga.
     * Database mein Save All button par save hoga.
     */
    setStocks((prev) => ({
      ...prev,
      [productId]: newStock,
    }));

    // Purana saved message remove
    setSaved(false);
  };

  /* ---------------- SAVE ALL STOCKS ---------------- */

  const handleSaveAllStocks = async () => {
    if (!isLoggedIn) {
      return;
    }

    try {
      setSaving(true);
      setSaved(false);

      /*
       * Sab products ko PostgreSQL mein save/update karein
       */
      await Promise.all(
        products.map(async (product) => {
          const stock =
            stocks[product.id] ?? 0;

          const response = await fetch(
            "/api/product-stock",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                productId: product.id,
                stock,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(
              `Failed to save ${product.name}`
            );
          }
        })
      );

      /*
       * Save successful
       */
      setSaved(true);

      /*
       * Products page ko notify
       */
      window.dispatchEvent(
        new Event("stockUpdated")
      );

      /*
       * 2 seconds baad message hide
       */
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Save all stocks error:",
        error
      );

      alert(
        "Stock save nahi ho saka. Dobara try karein."
      );
    } finally {
      setSaving(false);
    }
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

        {/* ---------------- HEADER ---------------- */}

        <div className="bg-white rounded-2xl shadow-md p-5 mb-6">

          <h1 className="text-2xl font-bold text-gray-800">
            Product Stock
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Yahan se product ka stock update karein.
          </p>
          <Link href="/components/StationaryStockInput" className="text-blue-500 hover:underline">
            Stationary Stock input
          </Link>

          {/* NOT LOGGED IN */}

          {!isLoggedIn && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm font-medium">
              🔒 Stock enter karne ke liye pehle login karein.
            </div>
          )}

          {/* LOGGED IN */}

          {isLoggedIn && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-600 rounded-lg px-4 py-3 text-sm font-medium">
              ✓ Login successful. Stock update kar sakte hain.
            </div>
          )}

        </div>

        {/* ---------------- PRODUCTS ---------------- */}

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
                    width={80}
                    height={80}
                  />

                </div>

                {/* PRODUCT NAME + INPUT */}

                <div className="flex-1 min-w-0">

                  <h2 className="font-semibold text-gray-800 text-sm mb-2">
                    {product.name}
                  </h2>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={
                      stocks[product.id] ?? 0
                    }
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

        {/* ---------------- ONE SAVE BUTTON ---------------- */}

        <div className="mt-6 flex justify-center">

          <button
            type="button"
            disabled={!isLoggedIn || saving}
            onClick={handleSaveAllStocks}
            className={`
              w-full
              sm:w-auto
              min-w-[220px]
              px-8
              py-3
              rounded-xl
              font-bold
              text-white
              shadow-md
              transition
              ${
                !isLoggedIn
                  ? "bg-gray-400 cursor-not-allowed"
                  : saving
                  ? "bg-blue-400 cursor-wait"
                  : saved
                  ? "bg-green-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            `}
          >

            {saving
              ? "Saving All Stocks..."
              : saved
              ? "✓ All Stocks Saved"
              : "Save All Stock"}

          </button>

        </div>

      </div>

    </div>
  );
}