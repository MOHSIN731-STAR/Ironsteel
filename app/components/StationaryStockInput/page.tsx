"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { stationaryProducts } from "../../types/stationaryProduct";

interface Stocks {
  [key: number]: number;
}

interface StockData {
  id: number;
  stationaryId: number;
  stock: number;
}

export default function StationaryStockInput() {
  const [stocks, setStocks] = useState<Stocks>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* =====================================================
     LOGIN CHECK
  ===================================================== */

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

  /* =====================================================
     LOAD STATIONARY STOCK
  ===================================================== */

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const response = await fetch(
          "/api/stationary-stock",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await response.json();

        console.log(
          "STATIONARY STOCK DATA:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.details ||
              data?.error ||
              "Failed to load stationary stocks"
          );
        }

        /* ---------------------------------------------
           Default stock for all stationary products
        --------------------------------------------- */

        const stockMap: Stocks = {};

        stationaryProducts.forEach(
          (product) => {
            stockMap[product.id] = 0;
          }
        );

        /* ---------------------------------------------
           Database stock
        --------------------------------------------- */

        if (Array.isArray(data)) {
          data.forEach(
            (item: StockData) => {
              const stationaryId =
                Number(item.stationaryId);

              const stock =
                Number(item.stock);

              console.log(
                "STATIONARY:",
                stationaryId,
                "STOCK:",
                stock
              );

              /*
               * Database stationaryId
               * = stationaryProducts.id
               */

              if (
                stationaryProducts.some(
                  (product) =>
                    product.id ===
                    stationaryId
                )
              ) {
                stockMap[stationaryId] =
                  stock;
              }
            }
          );
        }

        console.log(
          "FINAL STATIONARY STOCK MAP:",
          stockMap
        );

        setStocks(stockMap);
      } catch (error) {
        console.error(
          "Stationary stock load error:",
          error
        );

        /*
         * API fail hone par
         * default 0
         */

        const defaultStocks: Stocks = {};

        stationaryProducts.forEach(
          (product) => {
            defaultStocks[product.id] = 0;
          }
        );

        setStocks(defaultStocks);
      }
    };

    /* Initial load */
    loadStocks();

    /* ---------------------------------------------
       Listen for stock updates
    --------------------------------------------- */

    window.addEventListener(
      "stationaryStockUpdated",
      loadStocks
    );

    return () => {
      window.removeEventListener(
        "stationaryStockUpdated",
        loadStocks
      );
    };
  }, []);

  /* =====================================================
     STOCK CHANGE
  ===================================================== */

  const handleStockChange = (
    stationaryId: number,
    value: string
  ) => {
    if (!isLoggedIn) {
      return;
    }

    const newStock =
      value === ""
        ? 0
        : Number(value);

    if (Number.isNaN(newStock)) {
      return;
    }

    if (newStock < 0) {
      return;
    }

    setStocks((prev) => ({
      ...prev,
      [stationaryId]: newStock,
    }));

    setSaved(false);
  };

  /* =====================================================
     SAVE ALL STATIONARY STOCKS
  ===================================================== */

  const handleSaveAllStocks = async () => {
    if (!isLoggedIn) {
      return;
    }

    try {
      setSaving(true);
      setSaved(false);

      /*
       * Har stationary product ka
       * apna stationaryId save hoga.
       */

      await Promise.all(
        stationaryProducts.map(
          async (product) => {
            const stock =
              stocks[product.id] ?? 0;

            console.log(
              "SAVING:",
              {
                stationaryId:
                  product.id,
                stock: stock,
              }
            );

            const response =
              await fetch(
                "/api/stationary-stock",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  credentials:
                    "include",

                  body: JSON.stringify({
                    stationaryId:
                      product.id,
                    stock: stock,
                  }),
                }
              );

            const data =
              await response
                .json()
                .catch(
                  () => null
                );

            console.log(
              "SAVE RESPONSE:",
              data
            );

            if (!response.ok) {
              throw new Error(
                data?.details ||
                  data?.error ||
                  `Failed to save ${product.name}`
              );
            }
          }
        )
      );

      /* ---------------------------------------------
         Successfully saved
      --------------------------------------------- */

      setSaved(true);

      /*
       * Products page ko notify
       */

      window.dispatchEvent(
        new Event(
          "stationaryStockUpdated"
        )
      );

      /*
       * Agar Products page bhi
       * stockUpdated use karta hai
       */

      window.dispatchEvent(
        new Event("stockUpdated")
      );

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Save stationary stocks error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Stationary stock save nahi ho saka."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-gray-500">
          Loading...
        </p>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">

      <div className="max-w-5xl mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="bg-white rounded-2xl shadow-md p-5 mb-6">

          <h1 className="text-2xl font-bold text-gray-800">
            Stationary Product Stock
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Yahan se stationary product ka stock
            update karein.
          </p>

          <Link
            href="/products"
            className="text-blue-500 hover:underline"
          >
            Products
          </Link>

          {/* NOT LOGGED IN */}

          {!isLoggedIn && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm font-medium">
              🔒 Stock enter karne ke liye
              pehle login karein.
            </div>
          )}

          {/* LOGGED IN */}

          {isLoggedIn && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-600 rounded-lg px-4 py-3 text-sm font-medium">
              ✓ Login successful. Stock update
              kar sakte hain.
            </div>
          )}

        </div>

        {/* =================================================
            STATIONARY PRODUCTS
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {stationaryProducts.map(
            (product) => (

              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border p-4"
              >

                <div className="flex items-center gap-4">

                  {/* IMAGE */}

                  <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">

                    <Image
                      src={product.image}
                      alt={product.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                    />

                  </div>

                  {/* NAME + STOCK */}

                  <div className="flex-1 min-w-0">

                    <h2 className="font-semibold text-gray-800 text-sm mb-2">
                      {product.name}
                    </h2>

                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={
                        stocks[
                          product.id
                        ] ?? 0
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

        {/* =================================================
            SAVE ALL BUTTON
        ================================================= */}

        <div className="mt-6 flex justify-center">

          <button
            type="button"
            disabled={
              !isLoggedIn || saving
            }
            onClick={
              handleSaveAllStocks
            }
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