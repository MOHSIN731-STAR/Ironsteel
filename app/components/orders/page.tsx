"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Trash2,
  User,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Printer,
  X,
} from "lucide-react";

interface Item {
  id?: number;
  name: string;
  price: number;
  quantity: number;
  total?: number;
  createdAt?: string;
}

interface Order {
  id: number;
  customerName: string;
  items: Item[];
  total: number;
  createdAt: string;
  updatedAt?: string;
}

interface GroupedOrder {
  id: number;
  customerName: string;
  items: Item[];
  total: number;
  createdAt: string;
  updatedAt?: string;
  orderIds: number[];
}

export default function OrdersPage() {
  // =========================================================
  // ORDERS
  // =========================================================

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // SEARCH / DATE
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // =========================================================
  // EXPAND
  // =========================================================

  const [expandedOrders, setExpandedOrders] = useState<
    Record<string, boolean>
  >({});

  // =========================================================
  // EDIT
  // =========================================================

  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] =
    useState<GroupedOrder | null>(null);

  const [formData, setFormData] = useState<{
    customerName: string;
    items: Item[];
    total: number;
  }>({
    customerName: "",
    items: [],
    total: 0,
  });

  const [saving, setSaving] = useState(false);

  // =========================================================
  // OVERALL ITEM COUNTING
  // =========================================================

  const [overallSelectedItem, setOverallSelectedItem] =
    useState("");

  const [overallCountingPeriod, setOverallCountingPeriod] =
    useState<"day" | "weekly" | "monthly">("day");

  const [overallCountingDate, setOverallCountingDate] =
    useState(new Date().toISOString().split("T")[0]);

  // =========================================================
  // ITEM TOTAL
  // =========================================================

  const calculateItemTotal = (item: Item) => {
    return Number(item.price || 0) * Number(item.quantity || 0);
  };

  // =========================================================
  // ITEMS CALCULATED TOTAL
  //
  // NOTE:
  // This is only for display.
  // It NEVER overwrites order.total.
  // =========================================================

  const calculateItemsTotal = (items: Item[]) => {
    return items.reduce((sum, item) => {
      return sum + calculateItemTotal(item);
    }, 0);
  };

  // =========================================================
  // NORMALIZE CUSTOMER NAME
  // =========================================================

  const getGroupKey = (name: string) => {
    return name.trim().toLowerCase();
  };

  // =========================================================
  // FETCH ORDERS
  // =========================================================

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/orders", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch orders"
        );
      }

      const apiOrders: Order[] = (data.orders || []).map(
        (order: any) => ({
          ...order,

          id: Number(order.id),

          customerName: order.customerName || "",

          total: Number(order.total || 0),

          items: (order.items || []).map((item: any) => ({
            ...item,

            id:
              item.id !== undefined
                ? Number(item.id)
                : undefined,

            name: item.name || "",

            price: Number(item.price || 0),

            quantity: Number(item.quantity || 0),

            total:
              item.total !== undefined
                ? Number(item.total)
                : Number(item.price || 0) *
                  Number(item.quantity || 0),

            createdAt:
              item.createdAt || order.createdAt,
          })),
        })
      );

      setOrders(apiOrders);
    } catch (error: any) {
      console.error("Fetch orders error:", error);

      alert(
        error?.message || "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // =========================================================
  // DATE FILTER
  // =========================================================

  const dateFilteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);

      if (fromDate) {
        const start = new Date(`${fromDate}T00:00:00`);

        if (orderDate < start) {
          return false;
        }
      }

      if (toDate) {
        const end = new Date(`${toDate}T23:59:59.999`);

        if (orderDate > end) {
          return false;
        }
      }

      return true;
    });
  }, [orders, fromDate, toDate]);

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredOrders = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return dateFilteredOrders;
    }

    return dateFilteredOrders.filter((order) => {
      const customerMatch = order.customerName
        .toLowerCase()
        .includes(search);

      const itemMatch = order.items.some((item) =>
        item.name.toLowerCase().includes(search)
      );

      return customerMatch || itemMatch;
    });
  }, [dateFilteredOrders, searchTerm]);

  // =========================================================
  // GROUP ORDERS FOR DISPLAY
  //
  // IMPORTANT:
  //
  // Each saved order.total is added exactly once.
  //
  // Example:
  //
  // Customer A order = 6000
  // Customer B order = 4000
  // New order = 5000
  //
  // Overall = 15000
  //
  // =========================================================

  const groupedOrders = useMemo<GroupedOrder[]>(() => {
    const map = new Map<string, GroupedOrder>();

    filteredOrders.forEach((order) => {
      const key = getGroupKey(order.customerName);

      const items = (order.items || []).map((item) => ({
        ...item,
        createdAt: item.createdAt || order.createdAt,
      }));

      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          id: order.id,
          customerName: order.customerName,
          items,
          total: Number(order.total || 0),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          orderIds: [order.id],
        });
      } else {
        existing.items = [
          ...existing.items,
          ...items,
        ];

        existing.total += Number(order.total || 0);

        existing.orderIds.push(order.id);

        if (
          new Date(order.createdAt) <
          new Date(existing.createdAt)
        ) {
          existing.createdAt = order.createdAt;
        }
      }
    });

    return Array.from(map.values());
  }, [filteredOrders]);

  // =========================================================
  // OVERALL TOTAL
  //
  // Uses SAVED order totals.
  //
  // =========================================================

  const overallTotal = useMemo(() => {
    return orders.reduce((sum, order) => {
      return sum + Number(order.total || 0);
    }, 0);
  }, [orders]);

  // =========================================================
  // CUSTOMER GROUP COUNT
  // =========================================================

  const customerGroupCount = useMemo(() => {
    const unique = new Set<string>();

    orders.forEach((order) => {
      unique.add(getGroupKey(order.customerName));
    });

    return unique.size;
  }, [orders]);

  // =========================================================
  // TOGGLE GROUP
  // =========================================================

  const toggleExpand = (key: string) => {
    setExpandedOrders((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  // =========================================================
  // ITEM COUNTING
  // =========================================================

  const getItemCounting = (items: Item[]) => {
    const result: Record<string, number> = {};

    items.forEach((item) => {
      const name = item.name.trim();

      if (!name) return;

      result[name] =
        (result[name] || 0) +
        Number(item.quantity || 0);
    });

    return result;
  };

  // =========================================================
  // AVAILABLE ITEMS
  // =========================================================

  const availableItems = useMemo(() => {
    const items = new Set<string>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.name.trim()) {
          items.add(item.name.trim());
        }
      });
    });

    return Array.from(items).sort();
  }, [orders]);

  useEffect(() => {
    if (
      availableItems.length > 0 &&
      !overallSelectedItem
    ) {
      setOverallSelectedItem(availableItems[0]);
    }
  }, [availableItems, overallSelectedItem]);

  // =========================================================
  // COUNTING PERIOD FILTER
  // =========================================================

  const countingFilteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);

      const selectedDate = new Date(
        `${overallCountingDate}T00:00:00`
      );

      if (overallCountingPeriod === "day") {
        return (
          orderDate.getFullYear() ===
            selectedDate.getFullYear() &&
          orderDate.getMonth() ===
            selectedDate.getMonth() &&
          orderDate.getDate() ===
            selectedDate.getDate()
        );
      }

      if (overallCountingPeriod === "monthly") {
        return (
          orderDate.getFullYear() ===
            selectedDate.getFullYear() &&
          orderDate.getMonth() ===
            selectedDate.getMonth()
        );
      }

      if (overallCountingPeriod === "weekly") {
        const startOfWeek = new Date(selectedDate);

        const day = startOfWeek.getDay();

        const difference =
          day === 0 ? -6 : 1 - day;

        startOfWeek.setDate(
          startOfWeek.getDate() + difference
        );

        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);

        endOfWeek.setDate(
          endOfWeek.getDate() + 6
        );

        endOfWeek.setHours(
          23,
          59,
          59,
          999
        );

        return (
          orderDate >= startOfWeek &&
          orderDate <= endOfWeek
        );
      }

      return false;
    });
  }, [
    orders,
    overallCountingDate,
    overallCountingPeriod,
  ]);

  // =========================================================
  // SELECTED ITEM COUNT
  // =========================================================

  const selectedItemCount = useMemo(() => {
    if (!overallSelectedItem) return 0;

    return countingFilteredOrders.reduce(
      (sum, order) => {
        const count = order.items
          .filter(
            (item) =>
              item.name.trim() ===
              overallSelectedItem
          )
          .reduce(
            (itemSum, item) =>
              itemSum +
              Number(item.quantity || 0),
            0
          );

        return sum + count;
      },
      0
    );
  }, [
    countingFilteredOrders,
    overallSelectedItem,
  ]);

  // =========================================================
  // SELECTED ITEM AMOUNT
  // =========================================================

  const selectedItemAmount = useMemo(() => {
    if (!overallSelectedItem) return 0;

    return countingFilteredOrders.reduce(
      (sum, order) => {
        const amount = order.items
          .filter(
            (item) =>
              item.name.trim() ===
              overallSelectedItem
          )
          .reduce(
            (itemSum, item) =>
              itemSum +
              calculateItemTotal(item),
            0
          );

        return sum + amount;
      },
      0
    );
  }, [
    countingFilteredOrders,
    overallSelectedItem,
  ]);

  // =========================================================
  // EDIT GROUP
  //
  // For a customer group, the frontend currently edits
  // the first/selected order ID.
  //
  // If group contains only one order:
  // perfect.
  //
  // =========================================================

  const handleEdit = (group: GroupedOrder) => {
    /*
     * Important:
     *
     * group.total is the SAVED total.
     *
     * Do NOT use calculateItemsTotal(group.items).
     */

    setEditingOrder(group);

    setFormData({
      customerName: group.customerName,

      items: group.items.map((item) => ({
        ...item,
      })),

      total: Number(group.total || 0),
    });

    setShowModal(true);
  };

  // =========================================================
  // ADD ITEM
  // =========================================================

  const addItem = () => {
    setFormData((previous) => ({
      ...previous,

      items: [
        ...previous.items,

        {
          name: "",
          price: 0,
          quantity: 1,
          total: 0,
        },
      ],

      /*
       * TOTAL IS NOT CHANGED
       */
      total: previous.total,
    }));
  };

  // =========================================================
  // UPDATE ITEM
  //
  // IMPORTANT:
  //
  // Item update does NOT change total.
  //
  // =========================================================

  const updateItem = (
    index: number,
    field: keyof Item,
    value: string | number
  ) => {
    setFormData((previous) => {
      const updatedItems = [
        ...previous.items,
      ];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      return {
        ...previous,

        items: updatedItems,

        /*
         * VERY IMPORTANT
         *
         * Keep manually edited total.
         */
        total: previous.total,
      };
    });
  };

  // =========================================================
  // DELETE ITEM
  //
  // IMPORTANT:
  //
  // Item delete does NOT change total.
  //
  // =========================================================

  const removeItem = (index: number) => {
    setFormData((previous) => ({
      ...previous,

      items: previous.items.filter(
        (_, itemIndex) =>
          itemIndex !== index
      ),

      /*
       * Keep total exactly same.
       */
      total: previous.total,
    }));
  };

  // =========================================================
  // UPDATE CUSTOMER NAME
  // =========================================================

  const updateCustomerName = (
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,

      customerName: value,

      /*
       * Total remains unchanged.
       */
      total: previous.total,
    }));
  };

  // =========================================================
  // UPDATE MANUAL TOTAL
  //
  // This is the ONLY place where formData.total changes
  // intentionally.
  // =========================================================

  const updateManualTotal = (
    value: string
  ) => {
    const numericValue =
      value === ""
        ? 0
        : Number(value);

    setFormData((previous) => ({
      ...previous,

      total: Number.isFinite(numericValue)
        ? numericValue
        : 0,
    }));
  };

  // =========================================================
  // SAVE / UPDATE ORDER
  // =========================================================

const handleUpdateOrder = async () => {
  if (!editingOrder) return;

  const finalTotal = Number(
    formData.total
  );

  if (!formData.customerName.trim()) {
    alert("Customer name is required");
    return;
  }

  if (!Number.isFinite(finalTotal)) {
    alert("Please enter a valid total");
    return;
  }

  // ========================================================
  // VERY IMPORTANT
  //
  // Send ALL orders belonging to this customer group.
  //
  // Example:
  //
  // Customer A:
  // orderIds = [10, 15]
  //
  // API will merge them into ONE order.
  // ========================================================

  const orderIds =
    editingOrder.orderIds &&
    editingOrder.orderIds.length > 0
      ? editingOrder.orderIds
      : [editingOrder.id];

  try {
    setSaving(true);

    const response = await fetch(
      "/api/orders",
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          // ⭐ ALL GROUP ORDER IDS
          orderIds,

          customerName:
            formData.customerName.trim(),

          // ⭐ CURRENT ITEMS ONLY
          items: formData.items.map(
            (item) => ({
              name:
                item.name.trim(),

              price:
                Number(item.price) || 0,

              quantity:
                Number(item.quantity) || 0,
            })
          ),

          // ⭐ SAVED CUSTOMER TOTAL
          //
          // This is independent from item total.
          total: finalTotal,
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Failed to update order"
      );
    }

    setShowModal(false);
    setEditingOrder(null);

    // Fresh DB data
    await fetchOrders();

    alert(
      "Customer order updated successfully"
    );
  } catch (error: any) {
    console.error(
      "Update order error:",
      error
    );

    alert(
      error?.message ||
        "Failed to update order"
    );
  } finally {
    setSaving(false);
  }
};

  // =========================================================
  // DELETE CUSTOMER
  // =========================================================

  const handleDelete = async (
    customerName: string
  ) => {
    const confirmed = window.confirm(
      `Delete all orders of ${customerName}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        "/api/orders",
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            customerName,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to delete orders"
        );
      }

      await fetchOrders();

      alert(
        "Customer orders deleted successfully"
      );
    } catch (error: any) {
      console.error(
        "Delete error:",
        error
      );

      alert(
        error?.message ||
          "Failed to delete orders"
      );
    }
  };

  // =========================================================
  // PRINT
  // =========================================================

  const handlePrint = (
    group: GroupedOrder
  ) => {
    const printWindow =
      window.open(
        "",
        "_blank",
        "width=450,height=700"
      );

    if (!printWindow) {
      alert(
        "Please allow popups for printing."
      );
      return;
    }

    /*
     * VERY IMPORTANT:
     *
     * Print saved group total.
     * NOT calculated item total.
     */
    const printTotal =
      Number(group.total || 0);

    const dateText =
      new Date(
        group.createdAt
      ).toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

    const itemsHtml =
      group.items
        .map(
          (item) => `
            <tr>
              <td>
                ${escapeHtml(item.name)}
              </td>

              <td class="right">
                ${Number(
                  item.price || 0
                ).toLocaleString()}
              </td>

              <td class="right">
                ${Number(
                  item.quantity || 0
                )}
              </td>

              <td class="right">
                ${calculateItemTotal(
                  item
                ).toLocaleString()}
              </td>
            </tr>
          `
        )
        .join("");

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

      <head>

        <title>
          ${escapeHtml(
            group.customerName
          )}
        </title>

        <style>

          @page {
            size: 80mm auto;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          body {
            width: 80mm;
            margin: 0;
            padding: 4mm;
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #000;
          }

          .shop-name {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
          }

          .line {
            border-top: 1px dashed #000;
            margin: 7px 0;
          }

          .customer {
            margin-bottom: 5px;
            line-height: 1.6;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }

          th,
          td {
            padding: 4px 2px;
            border-bottom: 1px dashed #888;
          }

          th {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
          }

          .right {
            text-align: right;
          }

          .grand-total {
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 8px;
            margin-top: 8px;
          }

          .footer {
            text-align: center;
            margin-top: 15px;
            line-height: 1.5;
            font-weight: bold;
          }

        </style>

      </head>

      <body>

        <div class="shop-name">
          بسم اللہ آئرن سٹور
        </div>

        <div class="line"></div>

        <div class="customer">

          <div>
            <strong>Customer:</strong>
            ${escapeHtml(
              group.customerName
            )}
          </div>

          <div>
            <strong>Date:</strong>
            ${dateText}
          </div>

        </div>

        <table>

          <thead>

            <tr>

              <th>Item</th>

              <th class="right">
                Price
              </th>

              <th class="right">
                Qty
              </th>

              <th class="right">
                Total
              </th>

            </tr>

          </thead>

          <tbody>

            ${itemsHtml}

          </tbody>

        </table>

        <div class="grand-total">

          <span>
            Total
          </span>

          <span>
            Rs ${printTotal.toLocaleString()}
          </span>

        </div>

        <div class="footer">

          <div>
            Shop Number
          </div>

          <div>
            0307-1038571
          </div>

          <br />

          <div>
            بسم اللہ آئرن سٹور
          </div>

          <div>
            جمالپور نزد ماہر والا
          </div>

          <div>
            پٹرول پمپ قائم پور روڈ
          </div>

        </div>

      </body>

      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // =========================================================
  // RESET DATE
  // =========================================================

  const clearDates = () => {
    setFromDate("");
    setToDate("");
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">

      <div className="max-w-7xl mx-auto">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">

          <div>

            <h1 className="text-3xl font-bold text-gray-800">
              Orders
            </h1>

            <p className="text-gray-500 mt-1">
              Customer orders and totals
            </p>

          </div>

          {/* SEARCH */}

          <div className="relative w-full md:w-80">

            <Search
              size={20}
              className="absolute left-3 top-3 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search customer or item..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              className="w-full bg-white border rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

          </div>

        </div>

        {/* =====================================================
            DATE FILTER
        ===================================================== */}

        <div className="bg-white rounded-2xl shadow p-5 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

            <div>

              <label className="block font-semibold text-sm mb-2">
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-3"
              />

            </div>

            <div>

              <label className="block font-semibold text-sm mb-2">
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                onChange={(e) =>
                  setToDate(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-3"
              />

            </div>

            <button
              onClick={clearDates}
              className="bg-gray-200 hover:bg-gray-300 rounded-xl py-3 px-5 font-semibold"
            >
              Clear Dates
            </button>

          </div>

        </div>

        {/* =====================================================
            OVERALL TOTAL CARDS
        ===================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

          {/* OVERALL TOTAL */}

          <div className="bg-white rounded-2xl shadow p-6 border-l-4 border-indigo-600">

            <div className="text-gray-500 text-sm font-semibold">
              Overall Total
            </div>

            <div className="text-3xl font-bold text-indigo-600 mt-2">

              Rs{" "}

              {overallTotal.toLocaleString()}

            </div>

          </div>

          {/* CUSTOMER GROUPS */}

          <div className="bg-white rounded-2xl shadow p-6 border-l-4 border-green-600">

            <div className="text-gray-500 text-sm font-semibold">
              Customer Groups
            </div>

            <div className="text-3xl font-bold text-green-600 mt-2">
              {customerGroupCount}
            </div>

          </div>

          {/* ORDERS */}

          <div className="bg-white rounded-2xl shadow p-6 border-l-4 border-orange-500">

            <div className="text-gray-500 text-sm font-semibold">
              Total Orders
            </div>

            <div className="text-3xl font-bold text-orange-500 mt-2">
              {orders.length}
            </div>

          </div>

        </div>

        {/* =====================================================
            OVERALL ITEM COUNTING
        ===================================================== */}

        <div className="bg-white rounded-2xl shadow p-6 mb-6">

          <h2 className="text-2xl font-bold mb-5">
            Overall Item Counting
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* ITEM */}

            <div>

              <label className="block text-sm font-semibold mb-2">
                Select Item
              </label>

              <select
                value={
                  overallSelectedItem
                }
                onChange={(e) =>
                  setOverallSelectedItem(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-3 bg-white"
              >

                <option value="">
                  Select Item
                </option>

                {availableItems.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* PERIOD */}

            <div>

              <label className="block text-sm font-semibold mb-2">
                Period
              </label>

              <select
                value={
                  overallCountingPeriod
                }
                onChange={(e) =>
                  setOverallCountingPeriod(
                    e.target.value as
                      | "day"
                      | "weekly"
                      | "monthly"
                  )
                }
                className="w-full border rounded-xl p-3 bg-white"
              >

                <option value="day">
                  Daily
                </option>

                <option value="weekly">
                  Weekly
                </option>

                <option value="monthly">
                  Monthly
                </option>

              </select>

            </div>

            {/* DATE */}

            <div>

              <label className="block text-sm font-semibold mb-2">
                Date
              </label>

              <input
                type="date"
                value={
                  overallCountingDate
                }
                onChange={(e) =>
                  setOverallCountingDate(
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-3"
              />

            </div>

          </div>

          {/* COUNT RESULT */}

          {overallSelectedItem && (

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">

              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">

                <div className="text-sm text-gray-500">
                  Selected Item
                </div>

                <div className="font-bold text-xl mt-1">
                  {overallSelectedItem}
                </div>

              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">

                <div className="text-sm text-gray-500">
                  Total Quantity
                </div>

                <div className="font-bold text-3xl text-green-600 mt-1">
                  {selectedItemCount.toLocaleString()}
                </div>

              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">

                <div className="text-sm text-gray-500">
                  Item Amount
                </div>

                <div className="font-bold text-2xl text-orange-600 mt-1">

                  Rs{" "}

                  {selectedItemAmount.toLocaleString()}

                </div>

              </div>

            </div>

          )}

        </div>

        {/* =====================================================
            ORDERS LIST
        ===================================================== */}

        {loading ? (

          <div className="bg-white rounded-2xl shadow p-12 text-center">

            <div className="text-lg font-semibold">
              Loading orders...
            </div>

          </div>

        ) : groupedOrders.length === 0 ? (

          <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-500">

            No orders found.

          </div>

        ) : (

          <div className="space-y-5">

            {groupedOrders.map(
              (group) => {

                const groupKey =
                  getGroupKey(
                    group.customerName
                  );

                const expanded =
                  !!expandedOrders[
                    groupKey
                  ];

                const itemCounting =
                  getItemCounting(
                    group.items
                  );

                return (

                  <div
                    key={groupKey}
                    className="bg-white rounded-2xl shadow overflow-hidden"
                  >

                    {/* =================================================
                        GROUP HEADER
                    ================================================= */}

                    <div
                      onClick={() =>
                        toggleExpand(
                          groupKey
                        )
                      }
                      className="bg-indigo-600 text-white p-5 cursor-pointer hover:bg-indigo-700"
                    >

                      <div className="flex flex-col md:flex-row justify-between gap-4">

                        <div className="flex items-center gap-3">

                          <div className="bg-white/20 p-2 rounded-lg">

                            <User
                              size={22}
                            />

                          </div>

                          <div>

                            <div className="text-xl font-bold">

                              {
                                group.customerName
                              }

                            </div>

                            <div className="text-sm text-indigo-100">

                              {
                                group.items.length
                              }{" "}
                              items

                            </div>

                          </div>

                        </div>

                        <div className="flex items-center gap-5">

                          <div className="text-right">

                            <div className="text-sm text-indigo-100">
                              Total
                            </div>

                           <div className="text-sm text-white font-semibold">

                          

                            <span className="font-bold ml-2 text-white s">

                              Rs{" "}

                              {calculateItemsTotal(
                                group.items
                              ).toLocaleString()}

                            </span>

                          </div>

                          </div>

                          {expanded ? (
                            <ChevronUp />
                          ) : (
                            <ChevronDown />
                          )}

                        </div>

                      </div>

                    </div>

                    {/* =================================================
                        GROUP CONTENT
                    ================================================= */}

                    {expanded && (

                      <div className="p-5">

                        {/* ITEM COUNTING */}

                        <div className="mb-6">

                          <h3 className="font-bold text-lg mb-3">
                            Item Counting
                          </h3>

                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">

                            {Object.entries(
                              itemCounting
                            ).map(
                              ([
                                name,
                                quantity,
                              ]) => (

                                <div
                                  key={name}
                                  className="bg-gray-50 border rounded-xl p-3"
                                >

                                  <div className="text-sm font-semibold min-h-[40px]">
                                    {name}
                                  </div>

                                  <div className="text-2xl font-bold text-indigo-600 mt-1">
                                    {quantity}
                                  </div>

                                </div>

                              )
                            )}

                          </div>

                        </div>

                        {/* ITEMS TABLE */}

                        <div className="overflow-x-auto">

                          <table className="w-full min-w-[700px]">

                            <thead>

                              <tr className="border-b bg-gray-50">

                                <th className="text-left p-3">
                                  Date
                                </th>

                                <th className="text-left p-3">
                                  Item
                                </th>

                                <th className="text-right p-3">
                                  Qty/KG
                                </th>

                                <th className="text-right p-3">
                                  Price
                                </th>

                                <th className="text-right p-3">
                                  Item Total
                                </th>

                              </tr>

                            </thead>

                            <tbody>

                              {group.items.map(
                                (
                                  item,
                                  index
                                ) => (

                                  <tr
                                    key={`${groupKey}-${index}`}
                                    className="border-b"
                                  >

                                    <td className="p-3">

                                      {item.createdAt
                                        ? new Date(
                                            item.createdAt
                                          ).toLocaleDateString()
                                        : "-"}

                                    </td>

                                    <td className="p-3 font-medium">
                                      {item.name}
                                    </td>

                                    <td className="p-3 text-right">

                                      {Number(
                                        item.quantity || 0
                                      )}

                                    </td>

                                    <td className="p-3 text-right">

                                      Rs{" "}

                                      {Number(
                                        item.price || 0
                                      ).toLocaleString()}

                                    </td>

                                    <td className="p-3 text-right font-bold">

                                      Rs{" "}

                                      {calculateItemTotal(
                                        item
                                      ).toLocaleString()}

                                    </td>

                                  </tr>

                                )
                              )}

                            </tbody>

                          </table>

                        </div>

                        {/* =================================================
                            SAVED CUSTOMER TOTAL
                        ================================================= */}

                        <div className="mt-6 border-t pt-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                          <div>

                            {/* <div className="text-gray-500 text-sm">
                              Customer Total
                            </div> */}

                            {/* <div className="text-2xl font-bold text-green-600">

                              Rs{" "}

                              {Number(
                                group.total || 0
                              ).toLocaleString()}

                            </div> */}

                          </div>

                          <div className="text-sm text-gray-500">

                            Items calculated total:

                            <span className="font-bold ml-2 text-gray-700">

                              Rs{" "}

                              {calculateItemsTotal(
                                group.items
                              ).toLocaleString()}

                            </span>

                          </div>

                        </div>

                        {/* =================================================
                            ACTION BUTTONS
                        ================================================= */}

                        <div className="flex flex-wrap justify-end gap-3 mt-5">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                group
                              )
                            }
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold"
                          >

                            <Pencil
                              size={18}
                            />

                            Edit

                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                group.customerName
                              )
                            }
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold"
                          >

                            <Trash2
                              size={18}
                            />

                            Delete

                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handlePrint(
                                group
                              )
                            }
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold"
                          >

                            <Printer
                              size={18}
                            />

                            Print

                          </button>

                        </div>

                      </div>

                    )}

                  </div>

                );
              }
            )}

          </div>

        )}

      </div>

      {/* =========================================================
          EDIT MODAL
      ========================================================= */}

      {showModal && (

        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">

            {/* ===================================================
                MODAL HEADER
            =================================================== */}

            <div className="sticky top-0 z-10 bg-white border-b p-5 flex justify-between items-center">

              <div>

                <h2 className="text-2xl font-bold">
                  Edit Order
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Items and customer total are independent.
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingOrder(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >

                <X
                  size={24}
                />

              </button>

            </div>

            {/* ===================================================
                MODAL BODY
            =================================================== */}

            <div className="p-5">

              {/* CUSTOMER */}

              <div className="mb-6">

                <label className="block font-semibold mb-2">
                  Customer Name
                </label>

                <input
                  type="text"
                  value={
                    formData.customerName
                  }
                  onChange={(e) =>
                    updateCustomerName(
                      e.target.value
                    )
                  }
                  className="w-full border-2 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

              </div>

              {/* ITEMS HEADER */}

              <div className="flex flex-col md:flex-row justify-between gap-3 items-start md:items-center mb-4">

                <h3 className="text-xl font-bold">
                  Items
                </h3>

                <button
                  type="button"
                  onClick={addItem}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold"
                >

                  <Plus
                    size={18}
                  />

                  Add Item

                </button>

              </div>

              {/* ITEMS */}

              <div className="space-y-3">

                {formData.items.length === 0 ? (

                  <div className="border rounded-xl p-8 text-center text-gray-500">
                    No items.
                  </div>

                ) : (

                  formData.items.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        key={
                          item.id ??
                          `new-${index}`
                        }
                        className="border rounded-2xl p-4"
                      >

                        <div className="grid grid-cols-12 gap-3 items-end">

                          {/* ITEM */}

                          <div className="col-span-12 md:col-span-4">

                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                              Item
                            </label>

                            <input
                              type="text"
                              value={
                                item.name
                              }
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="Item name"
                              className="w-full border rounded-xl p-3"
                            />

                          </div>

                          {/* PRICE */}

                          <div className="col-span-6 md:col-span-2">

                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                              Price
                            </label>

                            <input
                              type="number"
                              step="0.01"
                              value={
                                item.price
                              }
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "price",
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              className="w-full border rounded-xl p-3"
                            />

                          </div>

                          {/* QTY */}

                          <div className="col-span-6 md:col-span-2">

                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                              Quantity
                            </label>

                            <input
                              type="number"
                              step="0.01"
                              value={
                                item.quantity
                              }
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              className="w-full border rounded-xl p-3"
                            />

                          </div>

                          {/* ITEM TOTAL */}

                          <div className="col-span-10 md:col-span-3">

                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                              Item Calculated Total
                            </label>

                            <div className="w-full border rounded-xl p-3 bg-gray-50 font-bold">

                              Rs{" "}

                              {calculateItemTotal(
                                item
                              ).toLocaleString()}

                            </div>

                          </div>

                          {/* DELETE */}

                          <div className="col-span-2 md:col-span-1">

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  index
                                )
                              }
                              className="w-full p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl"
                            >

                              <Trash2
                                size={20}
                                className="mx-auto"
                              />

                            </button>

                          </div>

                        </div>

                      </div>

                    )
                  )

                )}

              </div>

              {/* =================================================
                  SAVED / EDITABLE TOTAL
              ================================================= */}

              <div className="mt-7 border-2 border-indigo-500 bg-indigo-50 rounded-2xl p-5">

                <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">

                  <div>

                    <h3 className="text-xl font-bold text-indigo-900">
                      Customer Total
                    </h3>

                    <p className="text-sm text-indigo-700 mt-1">
                      This total will NOT change when
                      items are edited or deleted.
                    </p>

                  </div>

                  <div className="flex items-center gap-2">

                    <span className="text-xl font-bold">
                      Rs
                    </span>

                    <input
                      type="number"
                      step="0.01"
                      value={
                        formData.total
                      }
                      onChange={(e) =>
                        updateManualTotal(
                          e.target.value
                        )
                      }
                      className="w-64 border-2 border-indigo-500 rounded-xl px-4 py-3 text-2xl font-bold text-right bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                  </div>

                </div>

              </div>

              {/* =================================================
                  COMPARISON
              ================================================= */}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="bg-gray-50 border rounded-xl p-4">

                  <div className="text-sm text-gray-500">
                    Items Calculated Total
                  </div>

                  <div className="text-xl font-bold mt-1">

                    Rs{" "}

                    {calculateItemsTotal(
                      formData.items
                    ).toLocaleString()}

                  </div>

                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">

                  <div className="text-sm text-gray-500">
                    Saved Customer Total
                  </div>

                  <div className="text-xl font-bold text-indigo-600 mt-1">

                    Rs{" "}

                    {Number(
                      formData.total || 0
                    ).toLocaleString()}

                  </div>

                </div>

              </div>

            </div>

            {/* ===================================================
                MODAL FOOTER
            =================================================== */}

            <div className="sticky bottom-0 bg-white border-t p-5 flex flex-col sm:flex-row justify-end gap-3">

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setShowModal(false);
                  setEditingOrder(null);
                }}
                className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={
                  handleUpdateOrder
                }
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
              >

                {saving
                  ? "Saving..."
                  : "Save Changes"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

// ============================================================
// ESCAPE HTML FOR PRINT
// ============================================================

function escapeHtml(
  value: string
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(
      /'/g,
      "&#039;"
    );
}