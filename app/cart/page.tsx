"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCart } from "./../context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { printBillFromElement } from "../lib/printBill";
import Calculator from "../components/Calculator";

type PriceMap = Record<number, number>;

interface Stocks {
  [key: number]: number;
}

export default function Cart() {
  /* ---------------- STATES ---------------- */

  const [customerName, setCustomerName] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<any>(null);
  const [customerType, setCustomerType] =
    useState("walking");
  const [showPrint, setShowPrint] = useState(false);
  const [prices, setPrices] = useState<PriceMap>({});
  const [stocks, setStocks] = useState<Stocks>({});

  /* ---------------- CART ---------------- */

  const {
    cart,
    removeFromCart,
    updateQuantity,
  } = useCart();

  /* ---------------- PRICE HELPER ---------------- */

  const getPrice = (item: any) => {
    return prices[item.id] ?? item.price ?? 0;
  };

  /* ---------------- TOTAL HELPER ---------------- */

  const getCartTotal = () => {
    return cart.reduce((sum, item) => {
      return (
        sum +
        getPrice(item) * item.quantity
      );
    }, 0);
  };

  /* ---------------- LOAD STOCK ---------------- */

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const res = await fetch(
          "/api/product-stock",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!res.ok) {
          throw new Error(
            "Failed to load stock"
          );
        }

        const data = await res.json();

        const stockMap: Stocks = {};

        if (Array.isArray(data)) {
          data.forEach(
            (item: {
              productId: number;
              stock: number;
            }) => {
              stockMap[item.productId] =
                Number(item.stock);
            }
          );
        }

        setStocks(stockMap);
      } catch (error) {
        console.error(
          "Stock loading error:",
          error
        );

        setStocks({});
      }
    };

    loadStocks();

    // Same tab stock update
    const handleStockUpdated = () => {
      loadStocks();
    };

    window.addEventListener(
      "stockUpdated",
      handleStockUpdated
    );

    return () => {
      window.removeEventListener(
        "stockUpdated",
        handleStockUpdated
      );
    };
  }, []);

  /* ---------------- FETCH CUSTOMERS ---------------- */

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(
        "/api/customers"
      );

      const data = await res.json();

      if (
        data?.success &&
        Array.isArray(data?.data)
      ) {
        setCustomers(data.data);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.log(error);
      setCustomers([]);
    }
  };

  /* ---------------- GET PRODUCT STOCK ---------------- */

  const getStock = (productId: number) => {
    return Number(
      stocks[productId] ?? 0
    );
  };

  /* ---------------- CHANGE QUANTITY ---------------- */

  const handleQuantityChange = (
    item: any,
    value: string
  ) => {
    const stock = getStock(item.id);

    let quantity = Number(value);

    if (Number.isNaN(quantity)) {
      quantity = 0;
    }

    if (quantity < 0) {
      quantity = 0;
    }

    if (quantity > stock) {
      quantity = stock;

      alert(
        `Only ${stock} stock available for ${item.name}`
      );
    }

    updateQuantity(
      item.id,
      quantity
    );
  };

  /* ---------------- CHECK STOCK BEFORE CHECKOUT ---------------- */

  const checkStockBeforeCheckout = () => {
    for (const item of cart) {
      const availableStock =
        getStock(item.id);

      if (item.quantity <= 0) {
        alert(
          `Please enter quantity for ${item.name}`
        );

        return false;
      }

      if (
        item.quantity >
        availableStock
      ) {
        alert(
          `Only ${availableStock} stock available for ${item.name}`
        );

        return false;
      }
    }

    return true;
  };

  /* ---------------- REDUCE STOCK ---------------- */

  const reduceStockAfterSale = async () => {
    try {
      const updatedStocks: Stocks = {
        ...stocks,
      };

      for (const item of cart) {
        const currentStock = Number(
          updatedStocks[item.id] ?? 0
        );

        const soldQuantity = Number(
          item.quantity ?? 0
        );

        if (
          soldQuantity >
          currentStock
        ) {
          alert(
            `Only ${currentStock} stock available for ${item.name}`
          );

          return false;
        }

        /*
          Example:

          Current Stock = 120
          Sold Quantity = 20

          Remaining Stock = 100
        */

        const remainingStock =
          currentStock -
          soldQuantity;

        updatedStocks[item.id] =
          remainingStock;

        /* -------- SAVE STOCK TO POSTGRESQL -------- */

        const response =
          await fetch(
            "/api/product-stock",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials: "include",

              body: JSON.stringify({
                productId: item.id,
                stock: remainingStock,
              }),
            }
          );

        if (!response.ok) {
          throw new Error(
            `Failed to update stock for ${item.name}`
          );
        }
      }

      /* -------- UPDATE CURRENT STATE -------- */

      setStocks(updatedStocks);

      /* -------- NOTIFY OTHER COMPONENTS -------- */

      window.dispatchEvent(
        new Event("stockUpdated")
      );

      return true;
    } catch (error) {
      console.error(
        "Stock update error:",
        error
      );

      return false;
    }
  };

  /* ---------------- CHECKOUT ---------------- */

  const handleCheckout = async (
    shouldPrint = false
  ) => {
    try {
      /* ---------- CUSTOMER CHECK ---------- */

      if (
        customerType ===
          "regular" &&
        !selectedCustomer
      ) {
        alert(
          "Please select customer"
        );

        return false;
      }

      if (!customerName.trim()) {
        alert(
          "Please enter customer name"
        );

        return false;
      }

      if (!cart.length) {
        alert("Cart is empty");

        return false;
      }

      /* ---------- STOCK CHECK ---------- */

      const stockAvailable =
        checkStockBeforeCheckout();

      if (!stockAvailable) {
        return false;
      }

      /* ---------- API ---------- */

      const apiUrl =
        customerType === "regular"
          ? "/api/orders"
          : "/api/walking";

      const response = await fetch(
        apiUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            customer:
              customerType ===
              "regular"
                ? selectedCustomer?.id
                : null,

            customerName,

            items: cart.map(
              (item) => ({
                name: item.name,

                price: getPrice(item),

                quantity:
                  item.quantity,

                total:
                  getPrice(item) *
                  item.quantity,
              })
            ),

            total:
              getCartTotal(),
          }),
        }
      );

      const data =
        await response.json();

      /* ---------- SUCCESS ---------- */

      if (response.ok) {
        /*
          IMPORTANT:

          Order successfully saved
          FIRST.

          Then stock is reduced.

          Example:
          120 - 20 = 100
        */

        const stockUpdated =
          await reduceStockAfterSale();

        if (!stockUpdated) {
          alert(
            "Order save ho gaya, lekin stock update nahi ho saka ❌"
          );

          return false;
        }

        /* ---------- PRINT ---------- */

        if (shouldPrint) {
          setShowPrint(true);

          setTimeout(() => {
            const printArea =
              document.getElementById(
                "print-area"
              );

            if (printArea) {
              printBillFromElement(
                printArea
              );
            }

            setShowPrint(false);
          }, 300);
        }

        alert(
          "Order Saved Successfully ✅"
        );

        return true;
      }

      /* ---------- API ERROR ---------- */

      alert(
        data?.message ||
          "Failed to save order ❌"
      );

      return false;
    } catch (error) {
      console.error(error);

      alert(
        "Something went wrong ❌"
      );

      return false;
    }
  };

  /* ---------------- PRINT BUTTON ---------------- */

  const handlePrintBill = async () => {
    await handleCheckout(true);
  };

  /* ---------------- EMPTY CART ---------------- */

  if (!cart.length) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold">
          Cart Empty
        </h1>

        <Link
          href="/dashboard"
          className="text-3xl font-bold hover:text-blue-500 hover:underline"
        >
          Products
        </Link>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <>
      <div className="container mx-auto py-10 px-4">

        <h1 className="text-4xl font-bold mb-8">
          Your Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ---------------- ITEMS ---------------- */}

          <div className="lg:col-span-2">

            {cart.map((item) => {
              const availableStock =
                getStock(item.id);

              return (
                <div
                  key={item.id}
                  className="flex gap-6 bg-white p-6 mb-6 rounded-lg shadow"
                >

                  {/* IMAGE */}

                  <div className="relative w-40 h-40">

                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain"
                    />

                  </div>

                  {/* DETAILS */}

                  <div className="flex-1">

                    <h3 className="text-xl font-bold">
                      {item.name}
                    </h3>

                    <span>
                      Price
                    </span>

                    {/* PRICE INPUT */}

                    <input
                      type="number"
                      value={
                        prices[item.id] ??
                        ""
                      }
                      onChange={(e) =>
                        setPrices(
                          (prev) => ({
                            ...prev,
                            [item.id]:
                              Number(
                                e.target.value
                              ),
                          })
                        )
                      }
                      className="border px-3 py-2 mt-2 w-32"
                    />

                    {/* ITEM TOTAL */}

                    <p className="text-green-600 font-bold mt-2">
                      Rs{" "}
                      {(
                        getPrice(item) *
                        item.quantity
                      ).toLocaleString()}
                    </p>

                    {/* STOCK */}

                    {/* ---------------- QUANTITY ---------------- */}

                    <div className="flex gap-4 mt-3 items-center">

                      <span>
                        Kg/Qty
                      </span>

                      <input
                        type="number"
                        min={0}
                        max={
                          availableStock
                        }
                        value={
                          item.quantity
                        }
                        onChange={(e) =>
                          handleQuantityChange(
                            item,
                            e.target.value
                          )
                        }
                        className="border px-2 py-1 w-20"
                      />

                      <button
                        onClick={() =>
                          removeFromCart(
                            item.id
                          )
                        }
                        className="text-red-600"
                      >
                        Remove
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

          {/* ---------------- SUMMARY ---------------- */}

          <div className="bg-gray-100 p-6 rounded-xl">

            <h2 className="text-2xl font-bold text-center mb-4">
              بسم اللہ آئرن سٹور
            </h2>

            {/* CUSTOMER TYPE */}

            <div className="mb-4">

              <div className="flex gap-3 mb-3">

                <button
                  onClick={() => {
                    setCustomerType(
                      "walking"
                    );

                    setSelectedCustomer(
                      null
                    );

                    setCustomerName(
                      ""
                    );
                  }}
                  className={`px-4 py-2 rounded ${
                    customerType ===
                    "walking"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Walking
                </button>

                <button
                  onClick={() => {
                    setCustomerType(
                      "regular"
                    );

                    setCustomerName(
                      ""
                    );
                  }}
                  className={`px-4 py-2 rounded ${
                    customerType ===
                    "regular"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Regular
                </button>

              </div>

              {/* CONDITIONAL INPUT / LIST */}

              {customerType ===
              "walking" ? (

                <input
                  type="text"
                  value={
                    customerName
                  }
                  onChange={(e) =>
                    setCustomerName(
                      e.target.value
                    )
                  }
                  placeholder="Enter customer name"
                  className="w-full border px-3 py-2 rounded"
                />

              ) : (

                <select
                  value={
                    selectedCustomer?.id ||
                    ""
                  }
                  onChange={(e) => {

                    const customer =
                      customers.find(
                        (c: any) =>
                          String(
                            c.id
                          ) ===
                          e.target.value
                      );

                    setSelectedCustomer(
                      customer ||
                        null
                    );

                    setCustomerName(
                      customer?.name ||
                        ""
                    );
                  }}
                  className="w-full border p-2 rounded"
                >

                  <option value="">
                    Select Customer
                  </option>

                  {customers.map(
                    (c: any) => (
                      <option
                        key={c.id}
                        value={c.id}
                      >
                        {c.name}
                      </option>
                    )
                  )}

                </select>

              )}

            </div>

            {/* SUMMARY ITEMS */}

            <div className="space-y-2">

              <div className="grid grid-cols-3 font-bold border-b pb-2">

                <span>
                  Item
                </span>

                <span className="text-center">
                  Qty/Kg
                </span>

                <span className="text-right">
                  Price
                </span>

              </div>

              {cart.map((item) => (

                <div
                  key={item.id}
                  className="grid grid-cols-3 border-b py-2"
                >

                  <span>
                    {item.name}
                  </span>

                  <span className="text-center">
                    {item.quantity}
                  </span>

                  <span className="text-right">
                    Rs{" "}
                    {(
                      getPrice(item) *
                      item.quantity
                    ).toLocaleString()}
                  </span>

                </div>

              ))}

            </div>

            {/* TOTAL */}

            <div className="flex justify-between font-bold mt-4">

              <span>
                Total
              </span>

              <span>
                Rs{" "}
                {getCartTotal().toLocaleString()}
              </span>

            </div>

            {/* SAVE ORDER */}

            <button
              onClick={() =>
                handleCheckout(false)
              }
              className="w-full bg-green-600 text-white py-3 mt-4"
            >
              Save Order
            </button>

            {/* PRINT BILL */}

            <button
              onClick={
                handlePrintBill
              }
              className="w-full bg-blue-600 text-white py-3 mt-2"
            >
              Print Bill
            </button>

          </div>

        </div>

      </div>

      <Calculator />

      {/* ---------------- PRINT AREA ---------------- */}

      {showPrint &&
        createPortal(

          <div
            id="print-area"
            className="border border-black text-sm"
          >

            <h2 className="text-center font-bold mb-2">
              بسم اللہ آئرن سٹور
            </h2>

            <div className="text-center mb-3">

              <p>
                Name:{" "}
                {customerName}
              </p>

              <p className="font-bold text-[2px]">
                Date:{" "}
                {new Date().toLocaleDateString(
                  "en-GB",
                  {
                    weekday:
                      "long",
                    day: "2-digit",
                    month:
                      "long",
                    year:
                      "numeric",
                  }
                )}
              </p>

            </div>

            <div className="border-t border-b px-0 py-2 font-bold flex">

              <span className="w-1/4">
                Item
              </span>

              <span className="w-1/4 text-right">
                Price
              </span>

              <span className="w-1/4 text-right">
                Qty/Kg
              </span>

              <span className="w-1/4 text-right">
                Total
              </span>

            </div>

            {cart.map((item) => (

              <div
                key={item.id}
                className="bill-row flex py-1 border-b px-0"
              >

                <span className="w-1/4">
                  {item.name}
                </span>

                <span className="w-1/4 text-right">
                  {getPrice(item)}
                </span>

                <span className="w-1/4 text-right">
                  {item.quantity}
                </span>

                <span className="w-1/4 text-right">
                  {(
                    getPrice(item) *
                    item.quantity
                  ).toLocaleString()}
                </span>

              </div>

            ))}

            {/* TOTAL */}

            <div className="flex justify-between font-extrabold mt-3 pt-1 p-4 rounded-md">

              <span>
                Total
              </span>

              <span>
                Rs{" "}
                {getCartTotal().toLocaleString()}
              </span>

            </div>

            {/* FOOTER */}

            <div className="print-footer">

              <div className="flex mt-2 justify-between">

                <div className="flex-col gap-2">

                  <p className="text-sm font-bold text-gray-900">
                    Shop Number
                  </p>

                  <p className="text-sm font-bold text-gray-900">
                    0307-1038571
                  </p>

                </div>

                <div>

                  <div className="flex gap-2">

                    <p>
                      Sign
                    </p>

                    <span>
                      ___________
                    </span>

                  </div>

                </div>

              </div>

              <h3 className="text-center text-xl font-bold">
                بسم اللہ آئرن سٹور جمالپور نزد ماہر والا پٹرول پمپ قائم پور روڈ
              </h3>

            </div>

          </div>,

          document.body
        )}

    </>
  );
}