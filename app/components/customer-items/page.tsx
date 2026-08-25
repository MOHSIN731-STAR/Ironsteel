"use client";

import React, { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";

interface CustomerItem {
  id: number;
  customerName: string;
  item: string;
  quantity: number;
  price: number;
  totalPrice: number;
  paidPrice: number;
  remainingPrice: number;
  overallTotal?: number | null;
  overallPaid?: number | null;
  overallRemaining?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface OverallModal {
  customerName: string;
  total: string;
  paid: string;
}

export default function CustomerItemsPage() {
  const [items, setItems] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  // ======================================================
  // OVERALL MODAL
  // ======================================================

  const [showOverallModal, setShowOverallModal] = useState(false);

  const [overallModal, setOverallModal] =
    useState<OverallModal>({
      customerName: "",
      total: "",
      paid: "",
    });

  // ======================================================
  // FORM
  // ======================================================

  const [form, setForm] = useState({
    customerName: "",
    item: "سیمنٹ DG",
    quantity: "",
    price: "",
    paidPrice: "",
  });

  // ======================================================
  // CALCULATIONS
  // ======================================================

  const quantity = Number(form.quantity) || 0;
  const price = Number(form.price) || 0;
  const paidPrice = Number(form.paidPrice) || 0;

  const totalPrice = quantity * price;

  const remainingPrice = totalPrice - paidPrice;

  // ======================================================
  // GET ITEMS
  // ======================================================

  const fetchItems = async () => {
    try {
      setFetching(true);

      const response = await fetch(
        "/api/customer-items",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (result.success) {
        setItems(result.data || []);
      } else {
        setItems([]);
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

  // ======================================================
  // GROUP CUSTOMERS
  // ======================================================

  const groupedItems =
    items.reduce<Record<string, CustomerItem[]>>(
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

  // ======================================================
  // CUSTOMER OVERALL
  // ======================================================

  const getCustomerOverall = (
    customerItems: CustomerItem[]
  ) => {
    const savedOverall = customerItems.find(
      (item) =>
        item.overallTotal !== null &&
        item.overallTotal !== undefined
    );

    if (savedOverall) {
      const total =
        Number(savedOverall.overallTotal) || 0;

      const paid =
        Number(savedOverall.overallPaid) || 0;

      const remaining =
        savedOverall.overallRemaining !== null &&
        savedOverall.overallRemaining !== undefined
          ? Number(savedOverall.overallRemaining)
          : total - paid;

      return {
        total,
        paid,
        remaining,
      };
    }

    const total = customerItems.reduce(
      (sum, item) =>
        sum + Number(item.totalPrice || 0),
      0
    );

    const paid = customerItems.reduce(
      (sum, item) =>
        sum + Number(item.paidPrice || 0),
      0
    );

    return {
      total,
      paid,
      remaining: total - paid,
    };
  };

  // ======================================================
  // FORM CHANGE
  // ======================================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ======================================================
  // OVERALL CHANGE
  // ======================================================

  const handleOverallChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setOverallModal((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ======================================================
  // OPEN OVERALL MODAL
  // ======================================================

  const openOverallModal = (
    customerName: string,
    customerItems: CustomerItem[]
  ) => {
    const overall =
      getCustomerOverall(customerItems);

    setOverallModal({
      customerName,
      total: String(overall.total),
      paid: String(overall.paid),
    });

    setShowOverallModal(true);
  };

  // ======================================================
  // MODAL CALCULATION
  // ======================================================

  const modalTotal =
    Number(overallModal.total) || 0;

  const modalPaid =
    Number(overallModal.paid) || 0;

  const modalRemaining =
    modalTotal - modalPaid;

  // ======================================================
  // UPDATE OVERALL
  // ======================================================

  const handleUpdateOverall = async () => {
    if (!overallModal.customerName.trim()) {
      alert("Customer name is required");
      return;
    }

    if (modalTotal < 0) {
      alert("Overall total cannot be negative");
      return;
    }

    if (modalPaid < 0) {
      alert("Overall paid cannot be negative");
      return;
    }

    if (modalPaid > modalTotal) {
      alert(
        "Overall paid cannot be greater than overall total"
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/customer-items",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName:
              overallModal.customerName.trim(),

            overallTotal: modalTotal,

            overallPaid: modalPaid,

            overallRemaining: modalRemaining,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(
          result.message ||
            "Failed to update overall price"
        );
        return;
      }

      setShowOverallModal(false);

      await fetchItems();

      alert(
        "Overall price updated successfully"
      );
    } catch (error) {
      console.error(
        "Overall update error:",
        error
      );

      alert("Failed to update overall price");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // POST / PUT ITEM
  // ======================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    // ====================================================
    // CUSTOMER NAME REQUIRED
    // ====================================================

    if (!form.customerName.trim()) {
      alert("Customer name is required");
      return;
    }

    // ====================================================
    // IMPORTANT:
    // QUANTITY CAN BE 0
    // PRICE CAN BE 0
    // TOTAL CAN BE 0
    //
    // Example:
    // Customer = Ali
    // Item = amount Jama
    // Quantity = 0
    // Price = 0
    // Paid = 50000
    //
    // THIS IS VALID
    // ====================================================

    const currentQuantity =
      Number(form.quantity || 0);

    const currentPrice =
      Number(form.price || 0);

    const currentPaid =
      Number(form.paidPrice || 0);

    // ====================================================
    // ONLY NEGATIVE VALUES ARE INVALID
    // ====================================================

    if (currentQuantity < 0) {
      alert("Quantity cannot be negative");
      return;
    }

    if (currentPrice < 0) {
      alert("Price cannot be negative");
      return;
    }

    if (currentPaid < 0) {
      alert("Paid amount cannot be negative");
      return;
    }

    // ====================================================
    // TOTAL
    // ====================================================

    const currentTotal =
      currentQuantity * currentPrice;

    // ====================================================
    // PAID CAN ALSO BE GREATER THAN ITEM TOTAL
    //
    // Because your use case allows:
    //
    // Quantity = 0
    // Price = 0
    // Total = 0
    // Paid = 50000
    //
    // So DO NOT block:
    // paid > total
    // ====================================================

    try {
      setLoading(true);

      const customerName =
        form.customerName.trim();

      // ==================================================
      // GET CURRENT CUSTOMER OVERALL
      // ==================================================

      const existingCustomerItems =
        groupedItems[customerName] || [];

      const oldOverall =
        existingCustomerItems.length > 0
          ? getCustomerOverall(
              existingCustomerItems
            )
          : {
              total: 0,
              paid: 0,
              remaining: 0,
            };

      // ==================================================
      // REQUEST BODY
      // ==================================================

      const body = {
        ...(editingId !== null
          ? { id: editingId }
          : {}),

        customerName,

        item: form.item,

        quantity: currentQuantity,

        price: currentPrice,

        paidPrice: currentPaid,
      };

      // ==================================================
      // POST / PUT
      // ==================================================

      const response = await fetch(
        "/api/customer-items",
        {
          method:
            editingId !== null
              ? "PUT"
              : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(body),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(
          result.message ||
            "Something went wrong"
        );
        return;
      }

      // ==================================================
      // NEW ITEM
      // ADD ITEM TOTAL + PAID TO OVERALL
      // ==================================================

      if (editingId === null) {
        const newOverallTotal =
          oldOverall.total +
          currentTotal;

        const newOverallPaid =
          oldOverall.paid +
          currentPaid;

        const newOverallRemaining =
          newOverallTotal -
          newOverallPaid;

        // ================================================
        // SAVE OVERALL
        // ================================================

        const overallResponse =
          await fetch(
            "/api/customer-items",
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                customerName,

                overallTotal:
                  newOverallTotal,

                overallPaid:
                  newOverallPaid,

                overallRemaining:
                  newOverallRemaining,
              }),
            }
          );

        const overallResult =
          await overallResponse.json();

        if (
          !overallResponse.ok ||
          !overallResult.success
        ) {
          console.error(
            "Overall update failed:",
            overallResult
          );
        }
      }

      resetForm();

      await fetchItems();
    } catch (error) {
      console.error(
        "Submit error:",
        error
      );

      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // EDIT
  // ======================================================

  const handleEdit = (
    record: CustomerItem
  ) => {
    setEditingId(record.id);

    setForm({
      customerName:
        record.customerName,

      item: record.item,

      quantity:
        String(record.quantity),

      price:
        String(record.price),

      paidPrice:
        String(record.paidPrice),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ======================================================
  // DELETE ITEM
  // ======================================================

  const handleDelete = async (
    id: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this record?"
      );

    if (!confirmed) return;

    try {
      setLoading(true);

      const response = await fetch(
        "/api/customer-items",
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.message ||
            "Delete failed"
        );
        return;
      }

      await fetchItems();
    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // DELETE CUSTOMER GROUP
  // ======================================================

  const handleDeleteGroup = async (
    customerName: string,
    customerItems: CustomerItem[]
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete ALL ${customerItems.length} records of "${customerName}"?`
      );

    if (!confirmed) return;

    try {
      setLoading(true);

      await Promise.all(
        customerItems.map(
          async (record) => {
            const response =
              await fetch(
                "/api/customer-items",
                {
                  method: "DELETE",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    id: record.id,
                  }),
                }
              );

            const result =
              await response.json();

            if (
              !response.ok ||
              !result.success
            ) {
              throw new Error(
                result.message ||
                  `Failed to delete record ${record.id}`
              );
            }
          }
        )
      );

      await fetchItems();
    } catch (error) {
      console.error(
        "Group delete error:",
        error
      );

      alert(
        "Some records could not be deleted."
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // RESET
  // ======================================================

  const resetForm = () => {
    setEditingId(null);

    setForm({
      customerName: "",
      item: "سیمنٹ DG",
      quantity: "",
      price: "",
      paidPrice: "",
    });
  };

  // ======================================================
  // PRINT CUSTOMER
  // ======================================================

  const handlePrintGroup = (
    customerName: string,
    customerItems: CustomerItem[]
  ) => {
    const printWindow =
      window.open(
        "",
        "_blank",
        "width=400,height=700"
      );

    if (!printWindow) {
      alert(
        "Please allow popups for printing."
      );

      return;
    }

    const overall =
      getCustomerOverall(
        customerItems
      );

    const overallTotal =
      overall.total;

    const overallPaid =
      overall.paid;

    const overallRemaining =
      overall.remaining;

    const date =
      new Date().toLocaleDateString(
        "en-GB",
        {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );

    const itemsHTML =
      customerItems
        .map(
          (record) => `
        <div class="item-box">

          <div class="item-title">
            ${record.item}
          </div>

          <div class="item-row">
            <span class="label">
              QTY/KG
            </span>

            <span class="value">
              ${Number(
                record.quantity
              ).toLocaleString()}
            </span>
          </div>

          <div class="item-row">
            <span class="label">
              Price
            </span>

            <span class="value">
              Rs. ${Number(
                record.price
              ).toLocaleString()}
            </span>
          </div>

          <div class="item-row total-row">
            <span class="label">
              Total Amount
            </span>

            <span class="value">
              Rs. ${Number(
                record.totalPrice
              ).toLocaleString()}
            </span>
          </div>

          <div class="item-row item-paid">
            <span class="label">
              Paid Amount
            </span>

            <span class="value">
              Rs. ${Number(
                record.paidPrice
              ).toLocaleString()}
            </span>
          </div>

          <div class="item-row item-remaining">
            <span class="label">
              Remaining Amount
            </span>

            <span class="value">
              Rs. ${Number(
                record.remainingPrice
              ).toLocaleString()}
            </span>
          </div>

        </div>
      `
        )
        .join("");

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

          .shop {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 6px;
          }

          .customer {
            text-align: center;
            font-size: 15px;
            font-weight: bold;
            margin-bottom: 4px;
          }

          .date {
            text-align: center;
            font-size: 10px;
            margin-bottom: 8px;
          }

          .line {
            border-top: 1px solid #000;
            margin: 7px 0;
          }

          .item-box {
            padding: 8px 0;
            page-break-inside: avoid;
          }

          .item-title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
          }

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

          .total-row {
            margin-top: 2px;
            font-weight: bold;
          }

          .item-remaining {
            margin-top: 5px;
            padding-top: 5px;
            border-bottom: 1px solid #000;
            font-weight: bold;
          }

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

          .overall-total {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 10px 0;
            font-size: 15px;
          }

          .overall-paid {
            margin-top: 5px;
            border-bottom: 1px dashed #777;
            font-size: 14px;
          }

          .overall-remaining {
            margin-top: 5px;
            border-bottom: 1px solid #000;
            font-size: 14px;
          }

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

        <div class="shop">
          بسم اللہ آئرن سٹور
        </div>

        <div class="customer">
          Customer: ${customerName}
        </div>

        <div class="date">
          ${date}
        </div>

        <div class="line"></div>

        ${itemsHTML}

        <div class="summary">

          

          
          

        </div>

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

  // ======================================================
  // PAGE TOTALS
  // ======================================================

  const grandTotal = items.reduce(
    (sum, item) =>
      sum + Number(item.totalPrice || 0),
    0
  );

  const totalPaid = items.reduce(
    (sum, item) =>
      sum + Number(item.paidPrice || 0),
    0
  );

  const totalRemaining = items.reduce(
    (sum, item) =>
      sum + Number(item.remainingPrice || 0),
    0
  );

  // ======================================================
  // RETURN
  // ======================================================

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

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

        {/* FORM */}

        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-5 py-4 md:px-6">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-semibold text-slate-900">

                  {editingId !== null
                    ? "Update Customer Item"
                    : "Add Customer Item"}

                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Enter customer and material details
                </p>

              </div>

              {editingId !== null && (
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

                  <option value="سیمنٹ DG">
                    سیمنٹ DG
                  </option>
                  <option value="گاڈرمغل">
                  گاڈرمغل
                  </option>
                  <option value="سیمنٹ PK">
                    سیمنٹ PK
                  </option>

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

                  <option value="ٹی یار70*70">
                    ٹی یار70*70
                  </option>

                  <option value="بجری">
                    بجری
                  </option>
                  <option value="ٹائل فٹ والی">
                    ٹائل فٹ والی
                  </option>
 <option value="ٹائل 10انچ والی">
                    ٹائل 10انچ والی
                  </option>
      
 <option value="ٹی یار چوکاٹ">
                    ٹی یار چوکا ٹی
                  </option>

                  <option value="amount Jama">
                    amount Jama
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
                  Rs.{" "}
                  {totalPrice.toLocaleString()}
                </p>

              </div>

              {/* REMAINING */}

              <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">

                <p className="text-xs text-orange-600">
                  Remaining
                </p>

                <p className="mt-1 text-lg font-bold text-orange-700">
                  Rs.{" "}
                  {remainingPrice.toLocaleString()}
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
                  : editingId !== null
                  ? "Update Item"
                  : "Add Item"}

              </button>

            </div>

          </form>

        </div>

        {/* TABLE */}

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

            <table className="w-full min-w-[1150px] text-left">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 font-semibold uppercase tracking-wide text-black text-sm">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                      colSpan={9}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      Loading records...
                    </td>
                  </tr>

                ) : items.length === 0 ? (

                  <tr>
                    <td
                      colSpan={9}
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

                  Object.entries(
                    groupedItems
                  ).map(
                    ([
                      customerName,
                      customerItems,
                    ]) => {

                      const overall =
                        getCustomerOverall(
                          customerItems
                        );

                      return (
                        <React.Fragment
                          key={customerName}
                        >

                          {/* CUSTOMER HEADER */}

                          <tr className="bg-slate-500">

                            <td
                              colSpan={9}
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
                                      {
                                        customerItems.length
                                      }{" "}
                                      {customerItems.length ===
                                      1
                                        ? "item"
                                        : "items"}
                                    </p>

                                  </div>

                                </div>

                                <div className="flex flex-wrap items-center gap-3">

                                  <div className="rounded-lg bg-blue-600 px-3 py-2">

                                    <p className="text-[10px] text-white">
                                      OverAll Total Rs.
                                    </p>

                                    <p className="text-sm font-bold text-white">
                                      Rs.{" "}
                                      {overall.total.toLocaleString()}
                                    </p>

                                  </div>

                                  <div className="rounded-lg bg-blue-600 px-3 py-2">

                                    <p className="text-[10px] text-white">
                                      OverAll Paid Rs.
                                    </p>

                                    <p className="text-sm font-bold text-gray-100">
                                      Rs.{" "}
                                      {overall.paid.toLocaleString()}
                                    </p>

                                  </div>

                                  <div className="rounded-lg bg-blue-600 px-3 py-2">

                                    <p className="text-[10px] text-white">
                                      OverAll Remaining Rs.
                                    </p>

                                    <p className="text-sm font-bold text-orange-400">
                                      Rs.{" "}
                                      {overall.remaining.toLocaleString()}
                                    </p>

                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openOverallModal(
                                        customerName,
                                        customerItems
                                      )
                                    }
                                    className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600"
                                  >
                                    Update Overall
                                  </button>

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
                                    <Printer
                                      size={16}
                                    />
                                    Print Full
                                  </button>

                                  <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() =>
                                      handleDeleteGroup(
                                        customerName,
                                        customerItems
                                      )
                                    }
                                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Delete All
                                  </button>

                                </div>

                              </div>

                            </td>

                          </tr>

                          {/* ITEMS */}

                          {customerItems.map(
                            (record) => (

                              <tr
                                key={record.id}
                                className="transition hover:bg-slate-50"
                              >

                                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">

                                  {record.createdAt
                                    ? new Date(
                                        record.createdAt
                                      ).toLocaleDateString(
                                        "en-GB",
                                        {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                        }
                                      )
                                    : "-"}

                                </td>

                                <td className="px-5 py-4">

                                  <p className="font-semibold text-slate-900">
                                    {
                                      record.customerName
                                    }
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
                                        handleEdit(
                                          record
                                        )
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

                            )
                          )}

                        </React.Fragment>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* PAGE TOTALS */}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Overall Total Price
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              Rs.{" "}
              {grandTotal.toLocaleString()}
            </p>

          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">

            <p className="text-sm text-emerald-600">
              Overall Total Paid
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-700">
              Rs.{" "}
              {totalPaid.toLocaleString()}
            </p>

          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm">

            <p className="text-sm text-orange-600">
              Overall Remaining Price
            </p>

            <p className="mt-2 text-2xl font-bold text-orange-700">
              Rs.{" "}
              {totalRemaining.toLocaleString()}
            </p>

          </div>

        </div>

      </div>

      {/* ====================================================
          OVERALL MODAL
      ==================================================== */}

      {showOverallModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  Update Overall Price
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Customer:{" "}
                  <span className="font-semibold text-slate-700">
                    {
                      overallModal.customerName
                    }
                  </span>
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowOverallModal(false)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>

            </div>

            <div className="space-y-4 p-5">

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Overall Total Rs.
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="total"
                  value={
                    overallModal.total
                  }
                  onChange={
                    handleOverallChange
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-lg font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Overall Paid Rs.
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="paid"
                  value={
                    overallModal.paid
                  }
                  onChange={
                    handleOverallChange
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-lg font-bold text-emerald-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />

              </div>

              <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">

                <div className="flex items-center justify-between">

                  <span className="text-sm font-semibold text-orange-700">
                    Overall Remaining Rs.
                  </span>

                  <span className="text-xl font-bold text-orange-700">
                    Rs.{" "}
                    {modalRemaining.toLocaleString()}
                  </span>

                </div>

              </div>

            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">

              <button
                type="button"
                onClick={() =>
                  setShowOverallModal(false)
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={
                  handleUpdateOverall
                }
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Updating..."
                  : "Update Price"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}