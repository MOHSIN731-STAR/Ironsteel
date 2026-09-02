"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

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

// ============================================================
// TYPES
// ============================================================

interface Item {
  id?: number;
  orderId?: number;
  name: string;
  price: number;
  quantity: number;
  total?: number;
  createdAt?: string; // ← item ki apni date
}

interface Order {
  id: number;
  customerId?: number | null;
  customerName: string;
  total: number;
  itemsCalculatedTotal?: number | null;
  items: Item[];
  createdAt: string;
  updatedAt?: string;
}

interface GroupedOrder {
  id: number;
  customerName: string;
  items: Item[];
  total: number;
  itemsCalculatedTotal: number;
  createdAt: string;
  updatedAt?: string;
  orderIds: number[];

  // ==========================================================
  // EVERY ITEM NAME => TOTAL QUANTITY
  // ==========================================================
  itemQuantityCount: Record<string, number>;
}

// ============================================================
// COMPONENT
// ============================================================

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [expandedGroups, setExpandedGroups] = useState<
    Record<string, boolean>
  >({});

  const [showModal, setShowModal] = useState(false);

  const [editingOrder, setEditingOrder] =
    useState<GroupedOrder | null>(null);

  // ==========================================================
  // DATE FILTER
  // ==========================================================

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  // ==========================================================
  // ITEM COUNTING
  // ==========================================================

  const [selectedCountingItem, setSelectedCountingItem] =
    useState("");

  const [countingPeriod, setCountingPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");

  const [countingDate, setCountingDate] = useState("");

  // ==========================================================
  // FORM
  // ==========================================================

  const [formData, setFormData] = useState<{
    customerName: string;
    items: Item[];
    total: number;
    itemsCalculatedTotal: number;
  }>({
    customerName: "",
    items: [],
    total: 0,
    itemsCalculatedTotal: 0,
  });

  // ==========================================================
  // FETCH ORDERS
  // ==========================================================

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/orders", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch orders");
      }

      const fetchedOrders: Order[] = Array.isArray(data.orders)
        ? data.orders
        : Array.isArray(data.data)
        ? data.data
        : [];

      // ======================================================
      // NORMALIZE ORDERS
      // ======================================================

      const normalizedOrders = fetchedOrders.map((order) => {
        const items = Array.isArray(order.items)
          ? order.items.map((item) => {
              const price = Number(item.price) || 0;
              const quantity = Number(item.quantity) || 0;

              return {
                ...item,
                orderId: order.id,
                price,
                quantity,
                total:
                  item.total !== undefined && item.total !== null
                    ? Number(item.total)
                    : price * quantity,
                // ← item ki apni date, warna order ki date
                createdAt: item.createdAt || order.createdAt,
              };
            })
          : [];

        const calculatedFromItems = items.reduce(
          (sum, item) => sum + Number(item.total || 0),
          0
        );

        /*
         * Existing saved editable total
         * must be preserved.
         */

        const savedCalculatedTotal =
          order.itemsCalculatedTotal !== null &&
          order.itemsCalculatedTotal !== undefined
            ? Number(order.itemsCalculatedTotal)
            : calculatedFromItems;

        return {
          ...order,

          total: Number(order.total) || 0,

          items,

          itemsCalculatedTotal: Number.isFinite(savedCalculatedTotal)
            ? savedCalculatedTotal
            : calculatedFromItems,
        };
      });

      setOrders(normalizedOrders);
    } catch (error: any) {
      console.error("Fetch orders error:", error);

      alert(error?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchOrders();
  }, []);

  // ==========================================================
  // CALCULATE ITEMS TOTAL
  // ==========================================================

  const calculateItemsTotal = (items: Item[]) => {
    return items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;

      return sum + price * quantity;
    }, 0);
  };

  // ==========================================================
  // ⭐ ITEM-WISE QUANTITY COUNT
  // ==========================================================

  const calculateItemQuantityCount = (
    items: Item[]
  ): Record<string, number> => {
    const counts: Record<string, number> = {};

    items.forEach((item) => {
      const originalName = String(item.name || "").trim();

      if (!originalName) {
        return;
      }

      const quantity = Number(item.quantity) || 0;

      const existingKey = Object.keys(counts).find(
        (key) => key.trim().toLowerCase() === originalName.toLowerCase()
      );

      const finalKey = existingKey || originalName;

      if (counts[finalKey] === undefined) {
        counts[finalKey] = 0;
      }

      counts[finalKey] += quantity;
    });

    return counts;
  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "-";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ==========================================================
  // DATE ONLY
  // ==========================================================

  const getDateOnly = (dateString: string) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // ==========================================================
  // DATE FILTER
  // ==========================================================

  const dateFilteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = getDateOnly(order.createdAt);

      if (!orderDate) {
        return false;
      }

      if (fromDate && orderDate < fromDate) {
        return false;
      }

      if (toDate && orderDate > toDate) {
        return false;
      }

      return true;
    });
  }, [orders, fromDate, toDate]);

  // ==========================================================
  // GROUP ORDERS BY CUSTOMER
  // ==========================================================

  const groupedOrders = useMemo(() => {
    const map = new Map<string, GroupedOrder>();

    dateFilteredOrders.forEach((order) => {
      const key = order.customerName.trim().toLowerCase();

      const items = Array.isArray(order.items)
        ? order.items.map((item) => ({
            ...item,

            orderId: order.id,

            price: Number(item.price) || 0,

            quantity: Number(item.quantity) || 0,

            total: Number(
              item.total ??
                (Number(item.price) || 0) * (Number(item.quantity) || 0)
            ),

            // ← item ki apni date preserve
            createdAt: item.createdAt || order.createdAt,
          }))
        : [];

      const calculatedFromItems = calculateItemsTotal(items);

      const savedCalculatedTotal =
        order.itemsCalculatedTotal !== null &&
        order.itemsCalculatedTotal !== undefined
          ? Number(order.itemsCalculatedTotal)
          : calculatedFromItems;

      // ==================================================
      // ⭐ THIS ORDER'S ITEM COUNTS
      // ==================================================

      const itemQuantityCount = calculateItemQuantityCount(items);

      const existing = map.get(key);

      // ==================================================
      // FIRST ORDER
      // ==================================================

      if (!existing) {
        map.set(key, {
          id: order.id,

          customerName: order.customerName,

          items: [...items],

          total: Number(order.total) || 0,

          itemsCalculatedTotal: Number.isFinite(savedCalculatedTotal)
            ? savedCalculatedTotal
            : calculatedFromItems,

          createdAt: order.createdAt,

          updatedAt: order.updatedAt,

          orderIds: [order.id],

          // ⭐ ITEM-WISE COUNT
          itemQuantityCount: {
            ...itemQuantityCount,
          },
        });

        return;
      }

      // ==================================================
      // MERGE ITEMS
      // ==================================================

      existing.items = [...existing.items, ...items];

      // ==================================================
      // MERGE CUSTOMER TOTAL
      // ==================================================

      existing.total += Number(order.total) || 0;

      // ==================================================
      // MERGE CALCULATED TOTAL
      // ==================================================

      existing.itemsCalculatedTotal += Number.isFinite(savedCalculatedTotal)
        ? savedCalculatedTotal
        : calculatedFromItems;

      // ==================================================
      // MERGE ORDER IDS
      // ==================================================

      existing.orderIds.push(order.id);

      // ==================================================
      // ⭐ MERGE EVERY ITEM QUANTITY
      // ==================================================

      Object.entries(itemQuantityCount).forEach(([itemName, quantity]) => {
        const existingKey = Object.keys(existing.itemQuantityCount).find(
          (key) =>
            key.trim().toLowerCase() === itemName.trim().toLowerCase()
        );

        const finalKey = existingKey || itemName;

        if (existing.itemQuantityCount[finalKey] === undefined) {
          existing.itemQuantityCount[finalKey] = 0;
        }

        existing.itemQuantityCount[finalKey] += quantity;
      });

      // ==================================================
      // LATEST DATE
      // ==================================================

      if (new Date(order.createdAt) > new Date(existing.createdAt)) {
        existing.createdAt = order.createdAt;
      }
    });

    const result = Array.from(map.values());

    // ⭐ Latest item pehli row pe
    result.forEach((group) => {
      group.items.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // newest item first
      });
    });

    // ⭐ New order (group) pehle show ho
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // newest group first
    });

    return result;
  }, [dateFilteredOrders]);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return groupedOrders;
    }

    return groupedOrders.filter((group) => {
      const customerMatch = group.customerName
        .toLowerCase()
        .includes(query);

      const itemMatch = group.items.some((item) =>
        item.name.toLowerCase().includes(query)
      );

      return customerMatch || itemMatch;
    });
  }, [groupedOrders, search]);

  // ==========================================================
  // ALL UNIQUE ITEMS FOR COUNTING
  // ==========================================================

  const countingItems = useMemo(() => {
    const map = new Map<string, string>();

    orders.forEach((order) => {
      if (!Array.isArray(order.items)) {
        return;
      }

      order.items.forEach((item) => {
        const name = String(item.name || "").trim();

        if (!name) {
          return;
        }

        const key = name.toLowerCase();

        if (!map.has(key)) {
          map.set(key, name);
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [orders]);

  // ==========================================================
  // COUNTING DATE RANGE
  // ==========================================================

  const getCountingDateRange = useMemo(() => {
    if (!countingDate) {
      return null;
    }

    const selected = new Date(`${countingDate}T00:00:00`);

    if (Number.isNaN(selected.getTime())) {
      return null;
    }

    let start = new Date(selected);
    let end = new Date(selected);

    if (countingPeriod === "daily") {
      start = new Date(selected);
      end = new Date(selected);
    }

    if (countingPeriod === "weekly") {
      const day = selected.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;

      start = new Date(selected);
      start.setDate(selected.getDate() + mondayOffset);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
    }

    if (countingPeriod === "monthly") {
      start = new Date(selected.getFullYear(), selected.getMonth(), 1);

      end = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
    }

    return {
      start: getDateOnly(start.toISOString()),
      end: getDateOnly(end.toISOString()),
    };
  }, [countingDate, countingPeriod]);

  // ==========================================================
  // SELECTED ITEM COUNTING
  // ==========================================================

  const itemCountingResult = useMemo(() => {
    if (!selectedCountingItem) {
      return {
        quantity: 0,
        totalAmount: 0,
        orders: 0,
      };
    }

    let filtered = orders;

    // DATE FILTER
    if (fromDate || toDate) {
      filtered = filtered.filter((order) => {
        const date = getDateOnly(order.createdAt);

        if (fromDate && date < fromDate) {
          return false;
        }

        if (toDate && date > toDate) {
          return false;
        }

        return true;
      });
    }

    // PERIOD FILTER
    if (getCountingDateRange) {
      filtered = filtered.filter((order) => {
        const date = getDateOnly(order.createdAt);

        return (
          date >= getCountingDateRange.start &&
          date <= getCountingDateRange.end
        );
      });
    }

    let quantity = 0;
    let totalAmount = 0;
    let matchingOrders = 0;

    filtered.forEach((order) => {
      if (!Array.isArray(order.items)) {
        return;
      }

      let orderHasItem = false;

      order.items.forEach((item) => {
        const itemName = String(item.name || "")
          .trim()
          .toLowerCase();

        const selectedName = selectedCountingItem.trim().toLowerCase();

        if (itemName === selectedName) {
          const itemQuantity = Number(item.quantity) || 0;
          const itemPrice = Number(item.price) || 0;

          quantity += itemQuantity;
          totalAmount += itemPrice * itemQuantity;
          orderHasItem = true;
        }
      });

      if (orderHasItem) {
        matchingOrders++;
      }
    });

    return {
      quantity,
      totalAmount,
      orders: matchingOrders,
    };
  }, [
    orders,
    selectedCountingItem,
    getCountingDateRange,
    fromDate,
    toDate,
  ]);

  // ==========================================================
  // COUNTING TOTAL ORDERS
  // ==========================================================

  const countingTotalOrders = useMemo(() => {
    let result = orders;

    if (fromDate || toDate) {
      result = result.filter((order) => {
        const date = getDateOnly(order.createdAt);

        if (fromDate && date < fromDate) {
          return false;
        }

        if (toDate && date > toDate) {
          return false;
        }

        return true;
      });
    }

    if (getCountingDateRange) {
      result = result.filter((order) => {
        const date = getDateOnly(order.createdAt);

        return (
          date >= getCountingDateRange.start &&
          date <= getCountingDateRange.end
        );
      });
    }

    return result.length;
  }, [orders, fromDate, toDate, getCountingDateRange]);

  // ==========================================================
  // TOGGLE GROUP
  // ==========================================================

  const toggleGroup = (customerName: string) => {
    setExpandedGroups((previous) => ({
      ...previous,
      [customerName]: !previous[customerName],
    }));
  };

  // ==========================================================
  // ADD ITEM
  // ==========================================================

  const handleAddItem = () => {
    setFormData((previous) => ({
      ...previous,

      items: [
        ...previous.items,

        {
          name: "",
          price: 0,
          quantity: 1,
          total: 0,
          createdAt: new Date().toISOString(), // ← new item ko current date
        },
      ],
    }));
  };

  // ==========================================================
  // REMOVE ITEM
  // ==========================================================

  const handleRemoveItem = (index: number) => {
    setFormData((previous) => {
      const itemToDelete = previous.items[index];

      if (!itemToDelete) {
        return previous;
      }

      const oldPrice = Number(itemToDelete.price) || 0;
      const oldQuantity = Number(itemToDelete.quantity) || 0;
      const deletedItemTotal = oldPrice * oldQuantity;

      const currentCalculatedTotal =
        Number(previous.itemsCalculatedTotal) || 0;

      const newCalculatedTotal = currentCalculatedTotal - deletedItemTotal;

      return {
        ...previous,

        items: previous.items.filter(
          (_, itemIndex) => itemIndex !== index
        ),

        itemsCalculatedTotal: Math.max(0, newCalculatedTotal),
      };
    });
  };

  // ==========================================================
  // UPDATE ITEM
  // ==========================================================

  const handleItemChange = (
    index: number,
    field: "name" | "price" | "quantity",
    value: string
  ) => {
    setFormData((previous) => {
      const updatedItems = [...previous.items];

      const oldItem = updatedItems[index];

      if (!oldItem) {
        return previous;
      }

      const oldPrice = Number(oldItem.price) || 0;
      const oldQuantity = Number(oldItem.quantity) || 0;
      const oldTotal = oldPrice * oldQuantity;

      const currentItem = { ...oldItem };

      if (field === "name") {
        currentItem.name = value;
      }

      if (field === "price") {
        currentItem.price = value === "" ? 0 : Number(value);
      }

      if (field === "quantity") {
        currentItem.quantity = value === "" ? 0 : Number(value);
      }

      const newPrice = Number(currentItem.price) || 0;
      const newQuantity = Number(currentItem.quantity) || 0;
      const newTotal = newPrice * newQuantity;

      currentItem.total = newTotal;

      updatedItems[index] = currentItem;

      const currentCalculatedTotal =
        Number(previous.itemsCalculatedTotal) || 0;

      const updatedCalculatedTotal =
        currentCalculatedTotal - oldTotal + newTotal;

      return {
        ...previous,

        items: updatedItems,

        itemsCalculatedTotal: Math.max(0, updatedCalculatedTotal),
      };
    });
  };

  // ==========================================================
  // EDIT GROUP
  // ==========================================================

  const handleEdit = (group: GroupedOrder) => {
    setEditingOrder(group);

    const fallbackTotal = calculateItemsTotal(group.items);

    setFormData({
      customerName: group.customerName,

      items: group.items.map((item) => ({
        ...item,

        orderId: item.orderId,

        price: Number(item.price) || 0,

        quantity: Number(item.quantity) || 0,

        total: Number(
          item.total ??
            (Number(item.price) || 0) * (Number(item.quantity) || 0)
        ),

        // ← original date preserve
        createdAt: item.createdAt || group.createdAt,
      })),

      total: Number(group.total) || 0,

      itemsCalculatedTotal:
        group.itemsCalculatedTotal !== null &&
        group.itemsCalculatedTotal !== undefined
          ? Number(group.itemsCalculatedTotal)
          : fallbackTotal,
    });

    setShowModal(true);
  };

  // ==========================================================
  // UPDATE / MERGE
  // ==========================================================

  const handleUpdateOrder = async () => {
    if (!editingOrder) {
      return;
    }

    const customerTotal = Number(formData.total);
    const itemsCalculatedTotal = Number(formData.itemsCalculatedTotal);

    if (!formData.customerName.trim()) {
      alert("Customer name is required");
      return;
    }

    if (!Number.isFinite(customerTotal)) {
      alert("Please enter a valid Customer Total");
      return;
    }

    if (!Number.isFinite(itemsCalculatedTotal)) {
      alert("Please enter a valid Items Calculated Total");
      return;
    }

    try {
      setSaving(true);

      const primaryOrderId = editingOrder.id;
      const groupOrderIds = editingOrder.orderIds;

      const response = await fetch("/api/orders", {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          orderId: primaryOrderId,

          orderIds: groupOrderIds,

          customerName: formData.customerName.trim(),

          items: formData.items.map((item) => ({
            name: item.name.trim(),
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 0,
            // ← original date bhejo, warna current
            createdAt: item.createdAt || new Date().toISOString(),
          })),

          total: customerTotal,

          itemsCalculatedTotal: itemsCalculatedTotal,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update order");
      }

      setShowModal(false);
      setEditingOrder(null);

      await fetchOrders();

      alert("Orders merged and updated successfully");
    } catch (error: any) {
      console.error("Update order error:", error);

      alert(error?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // DELETE GROUP
  // ==========================================================

  const handleDeleteGroup = async (group: GroupedOrder) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete all orders of ${group.customerName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      for (const orderId of group.orderIds) {
        const response = await fetch("/api/orders", {
          method: "DELETE",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            orderId,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to delete order");
        }
      }

      await fetchOrders();

      alert("Customer orders deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);

      alert(error?.message || "Failed to delete orders");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // PRINT
  // ==========================================================

  const handlePrint = (group: GroupedOrder) => {
    const escapeHtml = (value: any) => {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const itemsRows = group.items
      .map((item) => {
        const itemTotal =
          Number(
            item.total ?? Number(item.price) * Number(item.quantity)
          ) || 0;

        return `
            <tr>
              <td>
                ${escapeHtml(item.name)}
              </td>

              <td>
                ${Number(item.price).toLocaleString()}
              </td>

              <td>
                ${Number(item.quantity).toLocaleString()}
              </td>

              <td>
                ${itemTotal.toLocaleString()}
              </td>
            </tr>
          `;
      })
      .join("");

    const itemsCalculatedTotal = Number(group.itemsCalculatedTotal) || 0;

    const printWindow = window.open("", "_blank", "width=400,height=700");

    if (!printWindow) {
      alert("Please allow popup to print");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

        <head>

          <title>
            Customer Order
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
              margin: 0;
              padding: 5mm;
              width: 80mm;
              font-family: Arial, sans-serif;
              font-size: 12px;
              font-weight: bold;
              color: #000;
            }

            .center {
              text-align: center;
            }

            .title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 4px;
            }

            .line {
              border-top: 1px solid #000;
              margin: 8px 0;
            }

            .customer {
              font-size: 15px;
              font-weight: bold;
              margin: 8px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-weight: bold;
              font-size: 12px;
            }

            th,
            td {
              padding: 4px 2px;
              border-bottom: 1px solid #999;
              text-align: left;
            }

            th {
              font-size: 11px;
              font-weight: bold;
            }

            .right {
              text-align: right;
              font-weight: bold;
              font-size: 16px;
            }

            .footer {
              margin-top: 10px;
              font-size: 11px;
            }

            .signature {
              margin-top: 10px;
              text-align: left;
              font-size: 12px;
            }

            .dox {
              font-size: 12px;
              text-align: center;
              line-height: 1.5;
              margin-top: 15px;
            }

          </style>

        </head>

        <body>

          

          
          <div class="customer">
            Customer:
            ${escapeHtml(group.customerName)}
          </div>

          <div>
            Date:
            ${new Date(group.createdAt).toLocaleString()}
          </div>

          <div class="line"></div>

          <table>

            <thead>

              <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>

            </thead>

            <tbody>
              ${itemsRows}
            </tbody>

          </table>

          <div class="line"></div>

          <table>

            <tr>

              <td>
                Total
              </td>

              <td class="right">
                Rs
                ${itemsCalculatedTotal.toLocaleString()}
              </td>

            </tr>

          </table>

          <div class="footer">

            <div class="signature">
              Sign ___________
            </div>

          </div>

          <h3 class="dox">
            بسم اللہ آئرن سٹور
            
            جمالپور نزد ماہر والا پٹرول پمپ
            
            قائم پور روڈ
          </h3>

          <script>

            window.onload =
              function () {

                window.print();

                setTimeout(
                  function () {
                    window.close();
                  },
                  500
                );

              };

          </script>

        </body>

      </html>
    `);

    printWindow.document.close();
  };

  // ==========================================================
  // CLEAR DATES
  // ==========================================================

  const clearDates = () => {
    setFromDate("");
    setToDate("");
  };

  // ==========================================================
  // STATS
  // ==========================================================

  const totalCustomers = groupedOrders.length;

  const totalOrders = dateFilteredOrders.length;

  const totalItems = groupedOrders.reduce(
    (sum, group) => sum + group.items.length,
    0
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Customer Orders
              </h1>

              <p className="text-gray-500 mt-1">Manage customer orders</p>
            </div>

            <button
              onClick={fetchOrders}
              disabled={loading}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* ====================================================
            DATE FILTER
        ==================================================== */}

        <div className="bg-white border shadow-sm rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Order Date Filter
              </h2>

              <p className="text-sm text-gray-500">
                Filter orders by created date
              </p>
            </div>

            <button
              type="button"
              onClick={clearDates}
              className="px-4 py-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 font-semibold"
            >
              Clear Date
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {(fromDate || toDate) && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
              Showing orders
              {fromDate ? ` from ${fromDate}` : ""}
              {toDate ? ` to ${toDate}` : ""}
            </div>
          )}
        </div>

        {/* ====================================================
            ITEM COUNTING
        ==================================================== */}

        <div className="bg-white border shadow-sm rounded-2xl p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Item Counting
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Count quantity and total amount of any item
              </p>
            </div>

            <div className="text-sm font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-xl">
              Total Orders: {countingTotalOrders}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Item
              </label>

              <select
                value={selectedCountingItem}
                onChange={(e) => setSelectedCountingItem(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Item</option>

                {countingItems.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Counting Period
              </label>

              <select
                value={countingPeriod}
                onChange={(e) =>
                  setCountingPeriod(
                    e.target.value as "daily" | "weekly" | "monthly"
                  )
                }
                className="w-full border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Date
              </label>

              <input
                type="date"
                value={countingDate}
                onChange={(e) => setCountingDate(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-blue-500 bg-blue-50 rounded-2xl p-5">
              <div className="text-sm font-semibold text-blue-700">
                Selected Item
              </div>

              <div className="text-xl font-bold text-blue-950 mt-2">
                {selectedCountingItem || "Select Item"}
              </div>
            </div>

            <div className="border-2 border-green-500 bg-green-50 rounded-2xl p-5">
              <div className="text-sm font-semibold text-green-700">
                {countingPeriod === "daily"
                  ? "Daily Quantity"
                  : countingPeriod === "weekly"
                  ? "Weekly Quantity"
                  : "Monthly Quantity"}
              </div>

              <div className="text-3xl font-bold text-green-950 mt-2">
                {Number(itemCountingResult.quantity).toLocaleString()}
              </div>

              <div className="text-xs text-green-700 mt-1">Quantity</div>
            </div>

            <div className="border-2 border-orange-500 bg-orange-50 rounded-2xl p-5">
              <div className="text-sm font-semibold text-orange-700">
                Total Amount
              </div>

              <div className="text-2xl font-bold text-orange-950 mt-2">
                Rs.{" "}
                {Number(itemCountingResult.totalAmount).toLocaleString()}
              </div>

              <div className="text-xs text-orange-700 mt-1">
                {itemCountingResult.orders} matching order
                {itemCountingResult.orders !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {countingDate && getCountingDateRange && (
            <div className="mt-4 bg-gray-50 border rounded-xl p-3 text-sm text-gray-600">
              Counting period:{" "}
              <strong>{getCountingDateRange.start}</strong> to{" "}
              <strong>{getCountingDateRange.end}</strong>
            </div>
          )}
        </div>

        {/* ====================================================
            STATS
        ==================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <div className="text-gray-500 text-sm">Customers</div>

            <div className="text-3xl font-bold mt-2">{totalCustomers}</div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <div className="text-gray-500 text-sm">Orders</div>

            <div className="text-3xl font-bold mt-2">{totalOrders}</div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <div className="text-gray-500 text-sm">Items</div>

            <div className="text-3xl font-bold mt-2">{totalItems}</div>
          </div>
        </div>

        {/* ====================================================
            SEARCH
        ==================================================== */}

        <div className="bg-white border shadow-sm rounded-2xl p-4 mb-6">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search customer or item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ====================================================
            CUSTOMER GROUPS
        ==================================================== */}

        <div className="space-y-4">
          {filteredGroups.length === 0 && (
            <div className="bg-white rounded-2xl border p-10 text-center text-gray-500">
              No orders found
            </div>
          )}

          {filteredGroups.map((group) => {
            const isExpanded = !!expandedGroups[group.customerName];

            const itemCounters = Object.entries(group.itemQuantityCount);

            return (
              <div
                key={`${group.customerName}-${group.id}`}
                className="bg-white border rounded-2xl shadow-sm overflow-hidden"
              >
                {/* ==================================================
                    GROUP HEADER
                ================================================== */}

                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* CUSTOMER */}

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User size={24} className="text-blue-600" />
                      </div>

                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {group.customerName}
                        </h2>

                        <p className="text-sm text-gray-500">
                          {group.items.length} item
                          {group.items.length !== 1 ? "s" : ""}
                          {" • "}
                          {group.orderIds.length} order
                          {group.orderIds.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      ⭐ EVERY ITEM QUANTITY COUNTER
                  ================================================== */}

                  {itemCounters.length > 0 && (
                    <div className="">
                      <div className="flex items-center justify-between ">
                        <div></div>

                        <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                          {itemCounters.length} different items
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        {itemCounters.map(([itemName, quantity]) => (
                          <div
                            key={itemName}
                            className="bg-gray-50 border border-gray-200 rounded-xl p-1 hover:border-blue-300 hover:bg-blue-50 transition"
                          >
                            <div
                              className="text-xs font-semibold text-gray-500 truncate"
                              title={itemName}
                            >
                              {itemName}
                            </div>

                            <div className="text-2xl font-bold text-gray-900 mt-1">
                              {Number(quantity).toLocaleString()}
                            </div>

                            <div className="text-[11px] text-gray-500">
                              Quantity
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ==================================================
                      ITEMS CALCULATED TOTAL
                  ================================================== */}

                  <div className="flex justify-end mt-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-1">
                      <div className="text-xs text-blue-600 font-medium">
                        overall Total
                      </div>

                      <div className="font-bold text-blue-900 mt-1">
                        Rs{" "}
                        {Number(group.itemsCalculatedTotal).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      BUTTONS
                  ================================================== */}

                  <div className="flex flex-wrap gap-2 mt-5">
                    <button
                      onClick={() => toggleGroup(group.customerName)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium"
                    >
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}

                      {isExpanded ? "Hide Items" : "Show Items"}
                    </button>

                    <button
                      onClick={() => handleEdit(group)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium"
                    >
                      <Pencil size={17} />
                      Edit
                    </button>

                    <button
                      onClick={() => handlePrint(group)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 text-white hover:bg-gray-900 font-medium"
                    >
                      <Printer size={17} />
                      Print
                    </button>

                    <button
                      onClick={() => handleDeleteGroup(group)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium"
                    >
                      <Trash2 size={17} />
                      Delete
                    </button>
                  </div>
                </div>

                {/* ==================================================
                    ITEMS TABLE
                ================================================== */}

                {isExpanded && (
                  <div className="border-t bg-gray-50 p-5">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="p-3">#</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Item</th>
                            <th className="p-3 text-right">Price</th>
                            <th className="p-3 text-right">Quantity</th>
                            <th className="p-3 text-right">Total</th>
                          </tr>
                        </thead>

                        <tbody>
                          {group.items.map((item, index) => (
                            <tr
                              key={
                                item.id ??
                                `${item.orderId}-${group.id}-${index}`
                              }
                              className="border-b last:border-b-0"
                            >
                              <td className="p-3">{index + 1}</td>

                              <td className="p-3 whitespace-nowrap">
                                {/* ← ab har item ki apni date */}
                                {formatDate(
                                  item.createdAt || group.createdAt
                                )}
                              </td>

                              <td className="p-3 font-medium">
                                {item.name}
                              </td>

                              <td className="p-3 text-right">
                                Rs {Number(item.price).toLocaleString()}
                              </td>

                              <td className="p-3 text-right">
                                {Number(item.quantity).toLocaleString()}
                              </td>

                              <td className="p-3 text-right font-semibold">
                                Rs{" "}
                                {Number(
                                  item.total ??
                                    Number(item.price) *
                                      Number(item.quantity)
                                ).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================
          EDIT MODAL
      ====================================================== */}

      {showModal && editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl">
            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 bg-white border-b px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">
                  Edit Customer Order
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingOrder.customerName}
                </p>

                <p className="text-xs text-blue-600 mt-1">
                  Merging {editingOrder.orderIds.length} orders into one
                  order
                </p>
              </div>

              <button
                onClick={() => {
                  if (saving) {
                    return;
                  }

                  setShowModal(false);
                  setEditingOrder(null);
                }}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              {/* CUSTOMER NAME */}

              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2">
                  Customer Name
                </label>

                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData((previous) => ({
                      ...previous,
                      customerName: e.target.value,
                    }))
                  }
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ITEMS */}

              <div className="border rounded-2xl overflow-hidden mb-5">
                <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">Items</h3>

                    <p className="text-xs text-gray-500">
                      Item total = Price × Quantity
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                  >
                    <Plus size={17} />
                    Add Item
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {formData.items.length === 0 && (
                    <div className="text-center text-gray-500 py-6">
                      No items
                    </div>
                  )}

                  {formData.items.map((item, index) => (
                    <div
                      key={item.id ?? `new-${index}`}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border rounded-xl p-3"
                    >
                      {/* ITEM NAME */}

                      <div className="md:col-span-5">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Item
                        </label>

                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            handleItemChange(index, "name", e.target.value)
                          }
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>

                      {/* PRICE */}

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Price
                        </label>

                        <input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(index, "price", e.target.value)
                          }
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>

                      {/* QUANTITY */}

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Quantity
                        </label>

                        <input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>

                      {/* TOTAL */}

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          Total
                        </label>

                        <div className="border rounded-lg px-3 py-2 bg-gray-50 font-semibold text-right">
                          Rs{" "}
                          {(
                            Number(item.price) * Number(item.quantity)
                          ).toLocaleString()}
                        </div>
                      </div>

                      {/* DELETE */}

                      <div className="md:col-span-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="w-full h-10 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* =================================================
                  EDITABLE ITEMS CALCULATED TOTAL
              ================================================= */}

              <div className="flex justify-end">
                <div className="border-2 border-blue-500 bg-blue-50 rounded-2xl p-5 w-full md:w-auto">
                  <label className="block text-sm font-bold text-blue-900 mb-1">
                    Items Calculated Total
                  </label>

                  <p className="text-xs text-blue-700 mb-3">
                    Editable total. Item delete/update will modify this
                    current value.
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">Rs</span>

                    <input
                      type="number"
                      step="0.01"
                      value={formData.itemsCalculatedTotal}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? 0
                            : Number(e.target.value);

                        setFormData((previous) => ({
                          ...previous,

                          itemsCalculatedTotal: Number.isFinite(value)
                            ? value
                            : 0,
                        }));
                      }}
                      className="w-full md:w-64 border-2 border-blue-400 rounded-lg px-3 py-3 text-xl font-bold text-right bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="sticky bottom-0 bg-white border-t px-5 py-4 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setShowModal(false);
                  setEditingOrder(null);
                }}
                className="px-5 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleUpdateOrder}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:opacity-50"
              >
                {saving ? "Merging..." : "Save & Merge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}