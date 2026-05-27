"use client";

import { useState, useEffect } from "react";
import { useCart } from "./../context/CartContext";
import Image from "next/image";

type PriceMap = Record<number, number>;

export default function Cart() {
  /* ---------------- STATES ---------------- */

  const [customerName, setCustomerName] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerType, setCustomerType] = useState("walking");
  const [showPrint, setShowPrint] = useState(false);
  const [prices, setPrices] = useState<PriceMap>({});
  

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

  /* ---------------- FETCH CUSTOMERS ---------------- */

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();

      if (data?.success && Array.isArray(data?.data)) {
        setCustomers(data.data);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.log(error);
      setCustomers([]);
    }
  };

  /* ---------------- CHECKOUT ---------------- */

  const handleCheckout = async () => {
    try {
      if (customerType === "regular" && !selectedCustomer) {
        alert("Please select customer");
        return;
      }

      if (!customerName.trim()) {
        alert("Please enter customer name");
        return;
      }

      if (!cart.length) {
        alert("Cart is empty");
        return;
      }

      const apiUrl =
        customerType === "regular"
          ? "/api/orders"
          : "/api/walking";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          customer:
            customerType === "regular"
              ? selectedCustomer?.id
              : null,

          customerName,

          items: cart.map((item) => ({
            name: item.name,
            price: getPrice(item),
            quantity: item.quantity,
            total: getPrice(item) * item.quantity,
          })),

          total: cart.reduce((sum, item) => {
            return sum + getPrice(item) * item.quantity;
          }, 0),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Order Saved Successfully ✅");
      } else {
        alert(data?.message || "Failed ❌");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong ❌");
    }
  };

  /* ---------------- PRINT ---------------- */

  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => window.print(), 300);
  };

  /* ---------------- EMPTY CART ---------------- */

  if (!cart.length) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold">Cart Empty</h1>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-4xl font-bold mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ---------------- ITEMS ---------------- */}
          <div className="lg:col-span-2">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-6 bg-white p-6 mb-6 rounded-lg shadow"
              >
                <div className="relative w-40 h-40">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {item.name}
                  </h3>

                  {/* PRICE INPUT */}
                  <input
                    type="number"
                    value={prices[item.id] ?? ""}
                    onChange={(e) =>
                      setPrices((prev) => ({
                        ...prev,
                        [item.id]: Number(e.target.value),
                      }))
                    }
                    className="border px-3 py-2 mt-2 w-32"
                  />

                  <p className="text-green-600 font-bold mt-2">
                    Rs {(getPrice(item) * item.quantity).toLocaleString()}
                  </p>

                  <div className="flex gap-4 mt-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.id, Number(e.target.value))
                      }
                      className="border px-2 py-1 w-20"
                    />

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                    setCustomerType("walking");
                    setSelectedCustomer(null);
                    setCustomerName("");
                  }}
                  className={`px-4 py-2 rounded ${
                    customerType === "walking"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Walking
                </button>

                <button
                  onClick={() => {
                    setCustomerType("regular");
                    setCustomerName("");
                  }}
                  className={`px-4 py-2 rounded ${
                    customerType === "regular"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Regular
                </button>
              </div>

              {/* CONDITIONAL INPUT / LIST */}
              {customerType === "walking" ? (
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(e.target.value)
                  }
                  placeholder="Enter customer name"
                  className="w-full border px-3 py-2 rounded"
                />
              ) : (
                <select
                  value={selectedCustomer?.id || ""}
                  onChange={(e) => {
                    const customer = customers.find(
                      (c: any) =>
                        String(c.id) === e.target.value
                    );

                    setSelectedCustomer(customer || null);
                    setCustomerName(customer?.name || "");
                  }}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select Customer</option>

                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* SUMMARY ITEMS */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 font-bold border-b pb-2">
                <span>Item</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Price</span>
              </div>

              {cart.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-3 border-b py-2"
                >
                  <span>{item.name}</span>
                  <span className="text-center">
                    {item.quantity}
                  </span>
                  <span className="text-right">
                    Rs{" "}
                    {(
                      getPrice(item) * item.quantity
                    ).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* TOTAL */}
            <div className="flex justify-between font-bold mt-4">
              <span>Total</span>
              <span>
                Rs{" "}
                {cart
                  .reduce(
                    (sum, item) =>
                      sum +
                      getPrice(item) * item.quantity,
                    0
                  )
                  .toLocaleString()}
              </span>
            </div>

            {/* BUTTONS */}
            <button
              onClick={handleCheckout}
              className="w-full bg-green-600 text-white py-3 mt-4"
            >
              Save Order
            </button>

            <button
              onClick={() => {
                handleCheckout();
                handlePrint();
              }}
              className="w-full bg-blue-600 text-white py-3 mt-2"
            >
              Print Bill
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- PRINT ---------------- */}
   {/* ---------------- PRINT ---------------- */}
{showPrint && (
  <div
    id="print-area"
    className="p-6 border border-black w-[80mm] mx-auto text-sm"
  >
    <h2 className="text-center font-bold mb-2">
      بسم اللہ آئرن سٹور
    </h2>

    <div className="text-center mb-3">
      <p>Customer: {customerName}</p>
    </div>

    <div className="border-t border-b py-2 font-bold flex justify-between">
      <span>Item</span>
      <span>Total</span>
    </div>

    {cart.map((item) => (
      <div
        key={item.id}
        className="flex justify-between py-1 border-b"
      >
        <span className="w-1/2">{item.name}</span>

        <span className="text-right w-1/2">
          {getPrice(item)} x {item.quantity} ={" "}
          {getPrice(item) * item.quantity}
        </span>
      </div>
    ))}

    <div className="flex justify-between font-bold mt-3 pt-2 ">
      <span>Total</span>
      <span>
        Rs{" "}
        {cart
          .reduce(
            (sum, item) =>
              sum + getPrice(item) * item.quantity,
            0
          )
          .toLocaleString()}
      </span>
    </div>
<div className="border-t border-b py-2"> 
  <textarea className="w-full h-16 p-3 mt-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" ></textarea> </div> <div className=" flex mt-6 justify-between "> <div className="flex-col gap-2 "> <p className="text-sm text-gray-900"> Shop Number </p> <p className="text-sm text-gray-900"> 0307-1038571 </p> </div> <div> <div className="flex gap-2 "> <p>Sign</p> <span>___________</span> </div> </div> </div> <div> <p className="text-center text-[10px] font-bold "> بسم اللہ آئرن سٹور جمالپور نزد ماہر والا پٹرول پمپ قائم پور روڈ </p> </div> </div>
  

  
)}
         </>
  );
}