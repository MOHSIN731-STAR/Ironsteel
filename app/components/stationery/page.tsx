"use client";

import { useEffect, useState } from "react";
import ProductCard from "./../../components/ProductCard";
import { Product } from "./../../types/product";
import { stationaryProducts } from "./../../types/stationaryProduct";
import { useRouter } from "next/navigation";

interface Stocks {
  [key: number]: number;
}

export default function Products() {
  const [stocks, setStocks] = useState<Stocks>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

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
          throw new Error("Failed to load product stocks");
        }

        const data = await response.json();

        const stockMap: Stocks = {};

        /*
         * Har stationary product ka default stock 0
         */
        stationaryProducts.forEach((product) => {
          stockMap[product.id] = 0;
        });

        /*
         * Database se stock load karein
         */
        if (Array.isArray(data)) {
          data.forEach(
            (item: {
              productId: number;
              stock: number;
            }) => {
              /*
               * Sirf stationary products ka stock
               * is page par show hoga.
               */
              const isStationaryProduct =
                stationaryProducts.some(
                  (product) =>
                    product.id === item.productId
                );

              if (isStationaryProduct) {
                stockMap[item.productId] =
                  Number(item.stock);
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

        /*
         * API fail ho to 0 show karein
         */
        const emptyStocks: Stocks = {};

        stationaryProducts.forEach((product) => {
          emptyStocks[product.id] = 0;
        });

        setStocks(emptyStocks);
      }
    };

    // Initial database load
    loadStocks();

    /*
     * Jab StationaryStockInput se
     * Save All Stocks ho
     */
    const handleStockUpdated = () => {
      loadStocks();
    };

    window.addEventListener(
      "stationaryStockUpdated",
      handleStockUpdated
    );

    /*
     * Normal stock update event bhi listen karein
     */
    window.addEventListener(
      "stockUpdated",
      handleStockUpdated
    );

    return () => {
      window.removeEventListener(
        "stationaryStockUpdated",
        handleStockUpdated
      );

      window.removeEventListener(
        "stockUpdated",
        handleStockUpdated
      );
    };
  }, []);

  /* ---------------- PRODUCT CLICK ---------------- */

  const handleProductClick = (product: Product) => {
    if (!isLoggedIn) {
      router.push("/components/login");
      return;
    }

    console.log(
      "Stationary product clicked:",
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

      <div className="container mx-auto py-12 px-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">

          {stationaryProducts.map((product) => (

            <div
              key={product.id}
              onClick={() =>
                handleProductClick(product)
              }
              className="cursor-pointer"
            >

              <div className="relative">

                {/* STOCK BADGE */}

                <div
                  className={`absolute top-2 right-2 z-20 px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                    (stocks[product.id] ?? 0) > 0
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  Stock: {stocks[product.id] ?? 0}
                </div>

                {/* PRODUCT */}

                <ProductCard
                  product={product}
                />

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}