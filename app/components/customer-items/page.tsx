"use client";

import React, { useEffect, useState } from "react";
import { Printer } from "lucide-react";

interface CustomerItem {
  id: number;
  customerName: string;
  item: string;
  quantity: number;
  price: number;
  totalPrice: number;
  paidPrice: number;
  remainingPrice: number;
}

export default function CustomerItemsPage() {
  const [items, setItems] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    customerName: "",
    item: "Cement",
    quantity: "",
    price: "",
    paidPrice: "",
  });

  // =========================
  // FORM CALCULATIONS
  // =========================

  const quantity = Number(form.quantity) || 0;
  const price = Number(form.price) || 0;
  const paidPrice = Number(form.paidPrice) || 0;

  const totalPrice = quantity * price;
  const remainingPrice = totalPrice - paidPrice;

  // =========================
  // GET
  // =========================

  const fetchItems = async () => {
    try {
      setFetching(true);

      const response = await fetch("/api/customer-items");

      const result = await response.json();

      if (result.success) {
        setItems(result.data || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // =========================
  // GROUP CUSTOMERS
  // =========================

  const groupedItems = items.reduce<Record<string, CustomerItem[]>>(
    (groups, item) => {
      const customer = item.customerName.trim();

      if (!groups[customer]) {
        groups[customer] = [];
      }

      groups[customer].push(item);

      return groups;
    },
    {}
  );

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // POST / UPDATE
  // =========================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.customerName.trim()) {
      alert("Customer name is required");
      return;
    }

    if (!form.quantity || Number(form.quantity) <= 0) {
      alert("Enter valid quantity");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      alert("Enter valid price");
      return;
    }

    if (paidPrice > totalPrice) {
      alert("Paid amount cannot be greater than total price");
      return;
    }

    try {
      setLoading(true);

      const body = {
        ...(editingId && { id: editingId }),
        customerName: form.customerName.trim(),
        item: form.item,
        quantity: Number(form.quantity),
        price: Number(form.price),
        paidPrice: Number(form.paidPrice) || 0,
      };

      const response = await fetch("/api/customer-items", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Something went wrong");
        return;
      }

      resetForm();

      await fetchItems();
    } catch (error) {
      console.error("Submit error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // EDIT
  // =========================

  const handleEdit = (record: CustomerItem) => {
    setEditingId(record.id);

    setForm({
      customerName: record.customerName,
      item: record.item,
      quantity: String(record.quantity),
      price: String(record.price),
      paidPrice: String(record.paidPrice),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/customer-items", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Delete failed");
        return;
      }

      await fetchItems();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed");
    }
  };

  // =========================
  // RESET
  // =========================

  const resetForm = () => {
    setEditingId(null);

    setForm({
      customerName: "",
      item: "Cement",
      quantity: "",
      price: "",
      paidPrice: "",
    });
  };

  // =========================
  // PRINT FULL CUSTOMER
  // =========================

  const handlePrintGroup = (
    customerName: string,
    customerItems: CustomerItem[]
  ) => {
    const printWindow = window.open(
      "",
      "_blank",
      "width=400,height=700"
    );

    if (!printWindow) {
      alert("Please allow popups for printing.");
      return;
    }

    // =========================
    // OVERALL TOTALS
    // =========================

    const overallTotal = customerItems.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );

    const overallPaid = customerItems.reduce(
      (sum, item) => sum + Number(item.paidPrice),
      0
    );

    const overallRemaining = customerItems.reduce(
      (sum, item) => sum + Number(item.remainingPrice),
      0
    );

    // =========================
    // DATE
    // =========================

    const date = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // =========================
    // ITEMS HTML
    // =========================

   const itemsHTML = customerItems
  .map(
    (record) => `
      <div class="item-box text-center">

        <div class="item-title text-center">
          ${record.item}
        </div>

        <div class="item-row">
          <span class="label">
            QTY/KG
          </span>

          <span class="value">
            ${Number(record.quantity).toLocaleString()}
          </span>
        </div>

        <div class="item-row">
          <span class="label">
            Price
          </span>

          <span class="value">
            Rs. ${Number(record.price).toLocaleString()}
          </span>
        </div>

        <div class="item-row total-row">
  <span class="label">
    Total Amount
  </span>

  <span class="value">
    Rs. ${Number(record.totalPrice).toLocaleString()}
  </span>
</div>

<div class="item-row item-paid">
  <span class="label">
    Paid Amount
  </span>

  <span class="value">
    Rs. ${Number(record.paidPrice).toLocaleString()}
  </span>
</div>

<div class="item-row item-remaining">
  <span class="label">
    Remaining Amount
  </span>

  <span class="value">
    Rs. ${Number(record.remainingPrice).toLocaleString()}
  </span>
</div>
    `
  )
  .join("");


// =========================
// PRINT HTML
    // =========================

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

        <head>

          <meta charset="UTF-8" />

          <title>
            ${customerName} Receipt
          </title>

          <style>

            @page {
              size: 80mm auto;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
            }

            body {
              width: 80mm;
              padding: 4mm;
              font-family: Arial, sans-serif;
              font-size: 12px;
              color: #000;
            }

            /* =========================
               SHOP
            ========================= */

            .shop {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 6px;
            }

            /* =========================
               CUSTOMER
            ========================= */

            .customer {
              text-align: center;
              font-size: 15px;
              font-weight: bold;
              margin-bottom: 4px;
            }

            /* =========================
               DATE
            ========================= */

            .date {
              text-align: center;
              font-size: 10px;
              margin-bottom: 8px;
            }

            /* =========================
               LINE
            ========================= */

            .line {
              border-top: 1px solid #000;
              margin: 7px 0;
            }

            /* =========================
               ITEM BOX
            ========================= */

            .item-box {
              padding: 8px 0;
             
              page-break-inside: avoid;
              
            }

            /* =========================
               ITEM NAME
            ========================= */

          .item-title {
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
}

            /* =========================
               ITEM ROW
            ========================= */

            .item-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              width: 100%;
              padding: 2px 0;
            }

            .label {
              font-weight: bold;
            }

            .value {
              text-align: right;
              white-space: nowrap;
            }

            /* =========================
               ITEM TOTAL
            ========================= */

            .total-row {
              margin-top: 2px;
              font-weight: bold;
            }

            /* =========================
               ITEM REMAINING
            ========================= */

            .item-remaining {
              margin-top: 5px;
              padding-top: 5px;
               border-bottom: 1px solid #000; 
              font-weight: bold;
            }

            .item-remaining .label,
            .item-remaining .value {
              font-size: 13px;
              
            }

            /* =========================
               OVERALL SUMMARY
            ========================= */

            .summary {
              width: 100%;
              margin-top: 12px;
            }

            .summary-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              width: 100%;
              padding: 8px 0;
              font-weight: bold;
            }

            /* =========================
               OVERALL TOTAL
            ========================= */

            .overall-total {
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 10px 0;
              font-size: 15px;
            }

            .overall-total .summary-value {
              font-size: 16px;
            }

            /* =========================
               OVERALL PAID
            ========================= */

            .overall-paid {
              margin-top: 5px;
              border-bottom: 1px dashed #777;
              font-size: 14px;
            }

            /* =========================
               OVERALL REMAINING
            ========================= */

            .overall-remaining {
              margin-top: 5px;
              border-bottom: 1px solid #000;
              font-size: 14px;
            }

            /* =========================
               FOOTER
            ========================= */

            .footer {
              border-top: 1px solid #000;
              margin-top: 14px;
              padding-top: 8px;
            }

            .shop-sign {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              width: 100%;
            }

            .shop-number {
              text-align: left;
              font-size: 11px;
            }

            .signature {
              text-align: right;
              font-size: 11px;
            }

            .address {
              text-align: center;
              font-weight: bold;
              margin-top: 12px;
              line-height: 1.5;
              font-size: 11px;
            }

          </style>

        </head>

        <body>

          <!-- SHOP -->

          <div class="shop">
            بسم اللہ آئرن سٹور
          </div>

          <!-- CUSTOMER -->

          <div class="customer">
            Customer: ${customerName}
          </div>

          <!-- DATE -->

          <div class="date">
            ${date}
          </div>

          <div class="line"></div>

          <!-- =========================
               ALL ITEMS
          ========================= -->

          ${itemsHTML}

          <!-- =========================
               OVERALL SUMMARY
          ========================= -->

          <div class="summary">

            <!-- OVERALL TOTAL PRICE -->

            <div class="summary-row overall-total">
  <span>
    Over all Total Amount
  </span>

  <span class="summary-value">
    Rs. ${overallTotal.toLocaleString()}
  </span>
</div>

<!-- OVERALL PAID -->

<div class="summary-row overall-paid">
  <span>
    OverAll Paid Amount
  </span>

  <span class="summary-value">
    Rs. ${overallPaid.toLocaleString()}
  </span>
</div>

<!-- OVERALL REMAINING -->

<div class="summary-row overall-remaining">
  <span>
    Over All Remaining Amount
  </span>

  <span class="summary-value">
    Rs. ${overallRemaining.toLocaleString()}
  </span>
</div>

</div>

          <!-- =========================
               FOOTER
          ========================= -->

          <div class="footer">

            <div class="shop-sign">

              <div class="shop-number">

                <strong>
                  Shop Number
                </strong>

                <br />

                0307-1038571

              </div>

              <div class="signature">

                <strong>
                  Sign
                </strong>

                <br />

                ___________

              </div>

            </div>

            <div class="address">

              بسم اللہ آئرن سٹور

              

              جمالپور نزد ماہر والا

              

              پٹرول پمپ قائم پور روڈ

            </div>

          </div>

        </body>

      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    };
  };

  // =========================
  // OVERALL PAGE TOTALS
  // =========================

  const grandTotal = items.reduce(
    (sum, item) => sum + Number(item.totalPrice),
    0
  );

  const totalPaid = items.reduce(
    (sum, item) => sum + Number(item.paidPrice),
    0
  );

  const totalRemaining = items.reduce(
    (sum, item) => sum + Number(item.remainingPrice),
    0
  );

  // =========================
  // RETURN
  // =========================

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">

      <div className="mx-auto max-w-7xl">

        {/* =========================
            HEADER
        ========================= */}

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <div>

            <p className="text-sm font-medium text-blue-600">
              CUSTOMER MANAGEMENT
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Customer Items
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage Cement, Sariya and Bajri payments
            </p>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

            <p className="text-xs text-slate-400">
              Total Records
            </p>

            <p className="text-xl font-bold text-slate-900">
              {items.length}
            </p>

          </div>

        </div>

        {/* =========================
            FORM
        ========================= */}

        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-5 py-4 md:px-6">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-semibold text-slate-900">
                  {editingId
                    ? "Update Customer Item"
                    : "Add Customer Item"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Enter customer and material details
                </p>

              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Cancel
                </button>
              )}

            </div>

          </div>

          <form
            onSubmit={handleSubmit}
            className="p-5 md:p-6"
          >

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">

              {/* CUSTOMER */}

              <div className="lg:col-span-2">

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Customer Name
                </label>

                <input
                  type="text"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

              </div>

              {/* ITEM */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Item
                </label>

                <select
                  name="item"
                  value={form.item}
                  onChange={handleChange}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                >

                  <option value="سریا moiz">
                    سریا moiz
                  </option>

                  <option value="سریا Azmat gold">
                    سریا Azmat gold
                  </option>

                  <option value="بجری">
                    بجری
                  </option>
 <option value="ٹی یار75*75">
                  ٹی یار75*75
                  </option>
                  <option value=" ٹی یار70*70">
                  ٹی یار70*70
                  </option>
                  <option value="Bajri">
                    بجری
                  </option>
                </select>

              </div>

              {/* QUANTITY */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Quantity
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

              </div>

              {/* PRICE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Price
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

              </div>

              {/* PAID */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Paid Amount
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="paidPrice"
                  value={form.paidPrice}
                  onChange={handleChange}
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

              </div>

              {/* TOTAL */}

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                <p className="text-xs text-slate-400">
                  Total Price
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  Rs. {totalPrice.toLocaleString()}
                </p>

              </div>

              {/* REMAINING */}

              <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">

                <p className="text-xs text-orange-600">
                  Remaining
                </p>

                <p className="mt-1 text-lg font-bold text-orange-700">
                  Rs. {remainingPrice.toLocaleString()}
                </p>

              </div>

            </div>

            <div className="mt-5 flex justify-end">

              <button
                type="submit"
                disabled={loading}
                className="h-11 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : editingId
                  ? "Update Item"
                  : "Add Item"}
              </button>

            </div>

          </form>

        </div>

        {/* =========================
            CUSTOMER TABLE
        ========================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-6">

            <div>

              <h2 className="font-semibold text-slate-900">
                Customer Records
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                All customer material transactions
              </p>

            </div>

            <button
              type="button"
              onClick={fetchItems}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Refresh
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px] text-left">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-5 py-4  font-semibold uppercase tracking-wide text-black text-sm">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-xs  font-semibold uppercase tracking-wide text-slate-500">
                    Item
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Qty/KG
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    رقم
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    کل رقم
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    جمع رقم
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                   بقایا رقم
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {fetching ? (

                  <tr>

                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      Loading records...
                    </td>

                  </tr>

                ) : items.length === 0 ? (

                  <tr>

                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center"
                    >

                      <p className="font-medium text-slate-700">
                        No records found
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Add your first customer item above.
                      </p>

                    </td>

                  </tr>

                ) : (

                  Object.entries(groupedItems).map(
                    ([customerName, customerItems]) => {

                      const customerTotal =
                        customerItems.reduce(
                          (sum, item) =>
                            sum + Number(item.totalPrice),
                          0
                        );

                      const customerPaid =
                        customerItems.reduce(
                          (sum, item) =>
                            sum + Number(item.paidPrice),
                          0
                        );

                      const customerRemaining =
                        customerItems.reduce(
                          (sum, item) =>
                            sum + Number(item.remainingPrice),
                          0
                        );

                      return (
                        <React.Fragment key={customerName}>

                          {/* CUSTOMER HEADER */}
                          

                          <tr className="bg-slate-500">

                            <td
                              colSpan={8}
                              className="px-5 py-3"
                            >

                              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                                <div className="flex items-center gap-3">

                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-900">

                                    {customerName
                                      .charAt(0)
                                      .toUpperCase()}

                                  </div>

                                  <div>

                                    <p className="font-bold text-white">
                                      {customerName}
                                    </p>

                                    <p className="text-xs text-slate-300">
                                      {customerItems.length}{" "}
                                      {customerItems.length === 1
                                        ? "item"
                                        : "items"}
                                    </p>

                                  </div>

                                </div>

                                <div className="flex flex-wrap items-center gap-3">

                                  <div className="rounded-lg bg-blue-600 px-3 py-2">

                                    <p className="text-[10px] uppercase text-white">
                                      کل رقم
                                    </p>

                                    <p className="text-sm font-bold text-white">
                                      Rs.{" "}
                                      {customerTotal.toLocaleString()}
                                    </p>

                                  </div>

                                  <div className="rounded-lg bg-blue-600 px-3 py-2">

                                    <p className="text-[10px] uppercase text-white">
                                    تمام جمع رقم
                                    </p>

                                    <p className="text-sm font-bold text-gray-100">
                                      Rs.{" "}
                                      {customerPaid.toLocaleString()}
                                    </p>

                                  </div>

                                  <div className="rounded-lg bg-blue-600 px-3 py-2">

                                    <p className="text-[10px] uppercase text-white">
                                      تمام بقایا رقم
                                    </p>

                                    <p className="text-sm font-bold text-orange-400">
                                      Rs.{" "}
                                      {customerRemaining.toLocaleString()}
                                    </p>

                                  </div>

                                  {/* PRINT FULL */}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePrintGroup(
                                        customerName,
                                        customerItems
                                      )
                                    }
                                    className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-slate-100"
                                  >

                                    <Printer size={16} />

                                    Print Full

                                  </button>

                                </div>

                              </div>

                            </td>

                          </tr>

                          {/* CUSTOMER ITEMS */}

                          {customerItems.map((record) => (

                            <tr
                              key={record.id}
                              className="transition hover:bg-slate-50"
                            >

                              <td className="px-5 py-4">

                                <p className="font-semibold text-slate-900">
                                  {record.customerName}
                                </p>

                              </td>

                              <td className="px-5 py-4">

                                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                                  {record.item}
                                </span>

                              </td>

                              <td className="px-5 py-4 text-sm text-slate-700">
                                {record.quantity}
                              </td>

                              <td className="px-5 py-4 text-sm text-slate-700">
                                Rs.{" "}
                                {Number(
                                  record.price
                                ).toLocaleString()}
                              </td>

                              <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                                Rs.{" "}
                                {Number(
                                  record.totalPrice
                                ).toLocaleString()}
                              </td>

                              <td className="px-5 py-4 text-sm font-medium text-emerald-600">
                                Rs.{" "}
                                {Number(
                                  record.paidPrice
                                ).toLocaleString()}
                              </td>

                              <td className="px-5 py-4 text-sm font-semibold text-orange-600">
                                Rs.{" "}
                                {Number(
                                  record.remainingPrice
                                ).toLocaleString()}
                              </td>

                              <td className="px-5 py-4">

                                <div className="flex justify-end gap-2">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEdit(record)
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDelete(
                                        record.id
                                      )
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                  >
                                    Delete
                                  </button>

                                </div>

                              </td>

                            </tr>

                          ))}

                        </React.Fragment>
                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* =========================
            OVERALL PAGE SUMMARY
        ========================= */}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* OVERALL TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Overall Total Price
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              Rs. {grandTotal.toLocaleString()}
            </p>

          </div>

          {/* OVERALL PAID */}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">

            <p className="text-sm text-emerald-600">
              Overall Total Paid
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-700">
              Rs. {totalPaid.toLocaleString()}
            </p>

          </div>

          {/* OVERALL REMAINING */}

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm">

            <p className="text-sm text-orange-600">
              Overall Remaining Price
            </p>

            <p className="mt-2 text-2xl font-bold text-orange-700">
              Rs. {totalRemaining.toLocaleString()}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}