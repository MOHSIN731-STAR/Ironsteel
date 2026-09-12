"use client";

import { useEffect, useState } from "react";
import ProductCard from "./../components/ProductCard";
import { products, Product } from "./../types/product";
import { useRouter } from "next/navigation";
import Calculator from "./../components/Calculator";

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

  /* ---------------- STOCK LOAD FROM POSTGRESQL ---------------- */

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const response = await fetch("/api/product-stock", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch stocks");
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
         * PostgreSQL se stock apply
         */
        data.forEach(
          (item: {
            productId: number;
            stock: number;
          }) => {
            stockMap[item.productId] = Number(item.stock);
          }
        );

        setStocks(stockMap);
      } catch (error) {
        console.error("Stock load error:", error);

        /*
         * Agar API fail ho jaye
         * to products ka stock 0 show hoga
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
     * StockInput se stock update hone ke baad
     * Products page automatically refresh karega
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

              {/* STOCK BADGE */}

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

              {/* PRODUCT CARD */}

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