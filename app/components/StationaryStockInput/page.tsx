"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { stationaryProducts } from "../../types/stationaryProduct";

interface Stocks {
  [key: number]: number;
}

export default function StationaryStockInput() {
  const [stocks, setStocks] = useState<Stocks>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  /* ---------------- STOCK LOAD FROM DATABASE ---------------- */

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const response = await fetch("/api/product-stock", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load stationary stocks");
        }

        const data = await response.json();

        const stockMap: Stocks = {};

        stationaryProducts.forEach((product) => {
          stockMap[product.id] = 0;
        });

        if (Array.isArray(data)) {
          data.forEach(
            (item: {
              productId: number;
              stock: number;
            }) => {
              /*
               * Sirf stationary products ka stock
               * load hoga.
               */
              if (
                stationaryProducts.some(
                  (product) => product.id === item.productId
                )
              ) {
                stockMap[item.productId] = Number(item.stock);
              }
            }
          );
        }

        setStocks(stockMap);
      } catch (error) {
        console.error(
          "Stationary stock loading error:",
          error
        );

        const emptyStocks: Stocks = {};

        stationaryProducts.forEach((product) => {
          emptyStocks[product.id] = 0;
        });

        setStocks(emptyStocks);
      }
    };

    loadStocks();

    const handleStockUpdated = () => {
      loadStocks();
    };

    window.addEventListener(
      "stationaryStockUpdated",
      handleStockUpdated
    );

    return () => {
      window.removeEventListener(
        "stationaryStockUpdated",
        handleStockUpdated
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

    /*
     * Sirf UI/state update hoga.
     * Database Save All button se hoga.
     */
    setStocks((prev) => ({
      ...prev,
      [productId]: newStock,
    }));
  };

  /* ---------------- SAVE ALL STOCKS ---------------- */

  const handleSaveAllStocks = async () => {
    if (!isLoggedIn) {
      alert("Pehle login karein ❌");
      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);

    try {
      /*
       * Har stationary product ka stock
       * database mein save/update hoga.
       */
      for (const product of stationaryProducts) {
        const stock = Number(
          stocks[product.id] ?? 0
        );

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
          const errorData = await response
            .json()
            .catch(() => null);

          throw new Error(
            errorData?.error ||
              `Failed to save ${product.name}`
          );
        }
      }

      /* -------- NOTIFY OTHER COMPONENTS -------- */

      window.dispatchEvent(
        new Event("stationaryStockUpdated")
      );

      window.dispatchEvent(
        new Event("stockUpdated")
      );

      alert(
        "Stationary stocks successfully save ho gaye ✅"
      );
    } catch (error) {
      console.error(
        "Stationary stock save error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Stationary stock save nahi ho saka ❌"
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

          {stationaryProducts.map(
            (product) => (

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

            )
          )}

        </div>

        {/* SAVE ALL BUTTON */}

        {isLoggedIn && (
          <div className="mt-6 flex justify-center">

            <button
              type="button"
              onClick={handleSaveAllStocks}
              disabled={saving}
              className={`
                px-8
                py-3
                rounded-xl
                font-semibold
                text-white
                shadow-md
                transition
                ${
                  saving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                }
              `}
            >
              {saving
                ? "Saving..."
                : "💾 Save All Stocks"}
            </button>

          </div>
        )}

      </div>

    </div>
  );
}