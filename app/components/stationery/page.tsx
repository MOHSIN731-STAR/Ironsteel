"use client";

import { useEffect, useState } from "react";
import ProductCard from "./../../components/ProductCard";
import { Product } from "./../../types/product";
import { stationaryProducts } from "./../../types/stationaryProduct";
import { useRouter } from "next/navigation";

interface Stocks {
  [key: number]: number;
}

interface StockData {
  stationaryId: number;
  stock: number;
}

export default function Products() {
  const [stocks, setStocks] = useState<Stocks>({});
  const [isLoggedIn, setIsLoggedIn] =
    useState(false);
  const [loading, setLoading] =
    useState(true);

  const router = useRouter();

  /* ---------------- LOGIN CHECK ---------------- */

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        setIsLoggedIn(response.ok);
      } catch (error) {
        console.error(
          "Auth check error:",
          error
        );

        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  /* ---------------- LOAD STATIONARY STOCK ---------------- */

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

        if (!response.ok) {
          throw new Error(
            "Failed to load stationary stocks"
          );
        }

        const data: StockData[] =
          await response.json();

        const stockMap: Stocks = {};

        /* Default stock = 0 */

        stationaryProducts.forEach(
          (product) => {
            stockMap[product.id] = 0;
          }
        );

        /* Database stock */

        if (Array.isArray(data)) {
          data.forEach((item) => {
            const productExists =
              stationaryProducts.some(
                (product) =>
                  product.id ===
                  item.stationaryId
              );

            if (productExists) {
              stockMap[item.stationaryId] =
                Number(item.stock);
            }
          });
        }

        console.log(
          "STATIONARY STOCK MAP:",
          stockMap
        );

        setStocks(stockMap);
      } catch (error) {
        console.error(
          "Stationary stock loading error:",
          error
        );

        const emptyStocks: Stocks = {};

        stationaryProducts.forEach(
          (product) => {
            emptyStocks[product.id] = 0;
          }
        );

        setStocks(emptyStocks);
      }
    };

    loadStocks();

    /* ---------------- STOCK UPDATE EVENT ---------------- */

    const handleStockUpdated = () => {
      loadStocks();
    };

    window.addEventListener(
      "stationaryStockUpdated",
      handleStockUpdated
    );

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

  const handleProductClick = (
    product: Product
  ) => {
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
          {stationaryProducts.map(
            (product) => (
              <div
                key={product.id}
                onClick={() =>
                  handleProductClick(
                    product
                  )
                }
                className="cursor-pointer"
              >
                <div className="relative">

                  {/* STOCK BADGE */}

                  <div
                    className={`absolute top-2 right-2 z-20 px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                      (stocks[
                        product.id
                      ] ?? 0) > 0
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    Stock:{" "}
                    {stocks[
                      product.id
                    ] ?? 0}
                  </div>

                  {/* IMPORTANT:
                      Stationary type */}
                  
                  <ProductCard
                    product={product}
                    type="stationary"
                  />

                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}