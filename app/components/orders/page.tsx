'use client';

import { useEffect, useState } from 'react';

import {
  Pencil,
  Trash2,
  User,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Printer,
} from 'lucide-react';

interface Item {
  name: string;
  price: number;
  quantity: number;
  total?: number;
  orderDate?: string;
}

interface Order {
  id: number;
  customerName: string;
  items: Item[];
  total: number;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [expandedOrders, setExpandedOrders] =
    useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // ================= DATE FILTER =================

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    items: [] as Item[],
    total: 0,
  });
  // ================= OVERALL ITEM COUNTING FILTER =================

const [overallSelectedItem, setOverallSelectedItem] =
  useState('');

const [overallCountingPeriod, setOverallCountingPeriod] =
  useState<'day' | 'weekly' | 'monthly'>('day');

const [overallCountingDate, setOverallCountingDate] =
  useState(new Date().toISOString().split('T')[0]);

  // ================= FETCH =================

  const fetchOrders = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        cache: 'no-store',
      });

      const data = await res.json();

      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ================= GROUP KEY =================

  const getGroupKey = (name: string) =>
    name.toLowerCase().trim();

  // ================= DATE FILTER =================

  const dateFilteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt);

    if (fromDate) {
      const from = new Date(`${fromDate}T00:00:00`);

      if (orderDate < from) {
        return false;
      }
    }

    if (toDate) {
      const to = new Date(`${toDate}T23:59:59.999`);

      if (orderDate > to) {
        return false;
      }
    }

    return true;
  });

  // ================= SEARCH + DATE =================

  const filteredOrders = dateFilteredOrders.filter((order) =>
    order.customerName
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // ================= GROUP ORDERS =================

  const groupedOrders = Array.from(
    filteredOrders.reduce((map, order) => {
      const key = getGroupKey(order.customerName);

      if (!map.has(key)) {
        map.set(key, {
          ...order,
          groupKey: key,

          items: order.items.map((i: any) => ({
            ...i,
            orderDate: order.createdAt,
          })),

          total: Number(order.total),
        });
      } else {
        const existing = map.get(key)!;

        existing.items = [
          ...existing.items,
          ...order.items.map((i: any) => ({
            ...i,
            orderDate: order.createdAt,
          })),
        ];

        existing.items = existing.items.filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex(
              (i: any) =>
                i.name === item.name &&
                Number(i.price) === Number(item.price) &&
                Number(i.quantity) === Number(item.quantity) &&
                i.orderDate === item.orderDate
            )
        );

        existing.total = filteredOrders
          .filter(
            (o) =>
              getGroupKey(o.customerName) === key
          )
          .reduce(
            (sum, o) => sum + Number(o.total),
            0
          );
      }

      return map;
    }, new Map())
      .values()
  );

  // ================= ITEM COUNTING FUNCTION =================

  const getItemCounting = (items: Item[]) => {
    return items.reduce(
      (
        acc: Record<string, number>,
        item
      ) => {
        const itemName = item.name.trim();

        if (!itemName) return acc;

        acc[itemName] =
          (acc[itemName] || 0) +
          Number(item.quantity);

        return acc;
      },
      {}
    );
  };

  // ================= OVERALL ITEM COUNTING =================

  // ================= OVERALL ITEM LIST =================

const overallAvailableItems = Array.from(
  new Set(
    orders.flatMap((order) =>
      order.items
        .map((item) => item.name.trim())
        .filter(Boolean)
    )
  )
).sort();

useEffect(() => {
  if (
    overallAvailableItems.length > 0 &&
    !overallSelectedItem
  ) {
    setOverallSelectedItem(
      overallAvailableItems[0]
    );
  }
}, [
  overallAvailableItems,
  overallSelectedItem,
]);

// ================= OVERALL COUNTING DATE FILTER =================

const overallCountingFilteredOrders =
  orders.filter((order) => {
    const orderDate = new Date(
      order.createdAt
    );

    const selectedDate = new Date(
      `${overallCountingDate}T00:00:00`
    );

    // ================= DAILY =================

    if (
      overallCountingPeriod === 'day'
    ) {
      return (
        orderDate.getFullYear() ===
          selectedDate.getFullYear() &&
        orderDate.getMonth() ===
          selectedDate.getMonth() &&
        orderDate.getDate() ===
          selectedDate.getDate()
      );
    }

    // ================= WEEKLY =================

    if (
      overallCountingPeriod === 'weekly'
    ) {
      const startOfWeek =
        new Date(selectedDate);

      const day =
        startOfWeek.getDay();

      // Monday = first day
      const diff =
        day === 0
          ? -6
          : 1 - day;

      startOfWeek.setDate(
        startOfWeek.getDate() + diff
      );

      startOfWeek.setHours(
        0,
        0,
        0,
        0
      );

      const endOfWeek =
        new Date(startOfWeek);

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

    // ================= MONTHLY =================

    if (
      overallCountingPeriod === 'monthly'
    ) {
      return (
        orderDate.getFullYear() ===
          selectedDate.getFullYear() &&
        orderDate.getMonth() ===
          selectedDate.getMonth()
      );
    }

    return false;
  });

// ================= OVERALL SELECTED ITEM COUNT =================

const overallSelectedItemCount =
  overallCountingFilteredOrders.reduce(
    (sum, order) => {
      const matchingItems =
        order.items.filter(
          (item) =>
            item.name.trim() ===
            overallSelectedItem
        );

      const quantity =
        matchingItems.reduce(
          (itemSum, item) =>
            itemSum +
            Number(item.quantity),
          0
        );

      return sum + quantity;
    },
    0
  );

// ================= OVERALL SELECTED ITEM AMOUNT =================

const overallSelectedItemAmount =
  overallCountingFilteredOrders.reduce(
    (sum, order) => {
      const matchingItems =
        order.items.filter(
          (item) =>
            item.name.trim() ===
            overallSelectedItem
        );

      const amount =
        matchingItems.reduce(
          (itemSum, item) =>
            itemSum +
            Number(item.price) *
              Number(item.quantity),
          0
        );

      return sum + amount;
    },
    0
  );

// ================= OVERALL COUNTING ORDERS =================

const overallCountingOrders =
  overallCountingFilteredOrders.length;
  // ================= CLEAR FILTER =================

  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
  };

  // ================= TOGGLE =================

  const toggleExpand = (key: string) => {
    setExpandedOrders((p) => ({
      ...p,
      [key]: !p[key],
    }));
  };

  // ================= EDIT =================

  const handleEdit = (group: any) => {
    setEditingOrder(group);

    setFormData({
      customerName: group.customerName,
      items: group.items,
      total: group.total,
    });

    setShowModal(true);
  };

  // ================= ADD ITEM =================

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,

      items: [
        ...prev.items,
        {
          name: '',
          price: 0,
          quantity: 1,
        },
      ],
    }));
  };

  // ================= REMOVE ITEM =================

  const removeItem = (index: number) => {
    const updatedItems =
      formData.items.filter(
        (_, i) => i !== index
      );

    const total = updatedItems.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
          Number(item.quantity),
      0
    );

    setFormData({
      ...formData,
      items: updatedItems,
      total,
    });
  };

  // ================= UPDATE ITEM =================

  const updateItem = (
    index: number,
    field: keyof Item,
    value: string | number
  ) => {
    const updatedItems = [
      ...formData.items,
    ];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    const total = updatedItems.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
          Number(item.quantity),
      0
    );

    setFormData({
      ...formData,
      items: updatedItems,
      total,
    });
  };

  // ================= UPDATE ORDER =================

  const handleUpdateOrder = async () => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          id: editingOrder?.id,
          customerName:
            formData.customerName,
          items: formData.items,
          total: formData.total,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        fetchOrders();

        alert('Updated Successfully');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ================= DELETE =================

  const handleDelete = async (
    customerName: string
  ) => {
    if (!confirm('Are you sure?')) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'DELETE',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          customerName,
        }),
      });

      const data = await res.json();

      if (data.success) {
        fetchOrders();

        alert(
          'Orders deleted successfully'
        );
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ================= PRINT =================

  const handlePrint = (group: any) => {
    const printWindow = window.open(
      '',
      '_blank',
      'width=400,height=600'
    );

    if (!printWindow) {
      alert(
        'Please allow popups for printing.'
      );

      return;
    }

    const formattedDate =
      new Date().toLocaleDateString(
        'en-GB',
        {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }
      );

    const itemsHTML = group.items
      .map(
        (item: any) => `
          <div class="bill-row">

            <span class="item-name">
              ${item.name}
            </span>

            <span class="price">
              ${Number(
                item.price
              ).toLocaleString()}
            </span>

            <span class="qty">
              ${item.quantity}
            </span>

            <span class="total">
              ${(
                Number(item.price) *
                Number(item.quantity)
              ).toLocaleString()}
            </span>

          </div>
        `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

        <head>

          <title>
            Order - ${group.customerName}
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
              margin: 0;
              padding: 0;
              width: 80mm;
            }

            body {
              padding: 4mm;
              font-family: Arial, sans-serif;
              font-size: 12px;
              color: #000;
            }

            .shop-name {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }

            .info {
              margin-bottom: 10px;
              line-height: 1.6;
            }

            .table-header,
            .bill-row {
              display: flex;
              width: 100%;
            }

            .table-header {
              font-weight: bold;
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 6px 0;
            }

            .bill-row {
              border-bottom: 1px solid #999;
              padding: 5px 0;
            }

            .item-name {
              width: 30%;
              word-break: break-word;
            }

            .price {
              width: 23%;
              text-align: right;
            }

            .qty {
              width: 18%;
              text-align: right;
            }

            .total {
              width: 29%;
              text-align: right;
            }

            .grand-total {
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #000;
              margin-top: 8px;
              padding-top: 8px;
              font-size: 16px;
              font-weight: bold;
            }

            .footer {
              border-top: 1px solid #000;
              margin-top: 15px;
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
              font-weight: bold;
            }

            .sign {
              text-align: right;
              font-weight: bold;
            }

            .address {
              text-align: center;
              font-size: 13px;
              font-weight: bold;
              margin-top: 12px;
              line-height: 1.5;
            }

          </style>

        </head>

        <body>

          <div class="shop-name">
            بسم اللہ آئرن سٹور
          </div>

          <div class="info">

            <div>
              <strong>Name:</strong>
              ${group.customerName}
            </div>

            <div>
              <strong>Date:</strong>
              ${formattedDate}
            </div>

          </div>

          <div class="table-header">

            <span class="item-name">
              Item
            </span>

            <span class="price">
              Price
            </span>

            <span class="qty">
              Qty/KG
            </span>

            <span class="total">
              Total
            </span>

          </div>

          ${itemsHTML}

          <div class="grand-total">

            <span>
              Grand Total
            </span>

            <span>
              Rs ${Number(
                group.total
              ).toLocaleString()}
            </span>

          </div>

          <div class="footer">

            <div class="shop-sign">

              <div class="shop-number">

                <div>
                  Shop Number
                </div>

                <div>
                  0307-1038571
                </div>

              </div>

              <div class="sign">

                <div>
                  Sign
                </div>

                <div>
                  ___________
                </div>

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

  // ================= RENDER =================

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-7xl mx-auto">

        {/* ================= HEADER ================= */}

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">

          <h1 className="text-3xl font-bold">
            All Orders
          </h1>

          <div className="relative w-full md:w-80">

            <Search className="absolute left-3 top-3 text-gray-400" />

            <input
              className="w-full pl-10 py-2 border rounded-xl"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {/* ================= DATE FILTER ================= */}

        <div className="bg-white rounded-2xl shadow p-5 mb-6">

          <div className="flex flex-col md:flex-row gap-4 items-end">

            {/* FROM */}

            <div className="flex-1 w-full">

              <label className="block font-semibold mb-2">
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
                className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

            </div>

            {/* TO */}

            <div className="flex-1 w-full">

              <label className="block font-semibold mb-2">
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
                className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

            </div>

            {/* CLEAR */}

            <button
              onClick={clearDateFilter}
              className="px-5 py-3 bg-gray-200 rounded-xl hover:bg-gray-300"
            >
              Clear Date
            </button>

          </div>

        </div>

        {/* ================= OVERALL SUMMARY ================= */}

    {/* ================= OVERALL ITEM COUNTING ================= */}

<div className="bg-white rounded-2xl shadow p-6 mb-6">

  {/* HEADER */}

  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-5">

    <h2 className="text-2xl font-bold">
      Overall Item Counting
    </h2>

    <div className="font-semibold">
      Total Orders:

      <span className="text-indigo-600 ml-2">
        {overallCountingOrders}
      </span>
    </div>

  </div>

  {/* ================= FILTERS ================= */}

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

    {/* ITEM */}

    <div>

      <label className="block text-sm font-semibold mb-2">
        Select Item
      </label>

      <select
        value={overallSelectedItem}
        onChange={(e) =>
          setOverallSelectedItem(
            e.target.value
          )
        }
        className="border p-3 w-full rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >

        <option value="">
          Select Item
        </option>

        {overallAvailableItems.map(
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
        Counting Period
      </label>

      <select
        value={overallCountingPeriod}
        onChange={(e) =>
          setOverallCountingPeriod(
            e.target.value as
              | 'day'
              | 'weekly'
              | 'monthly'
          )
        }
        className="border p-3 w-full rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        Select Date
      </label>

      <input
        type="date"
        value={overallCountingDate}
        onChange={(e) =>
          setOverallCountingDate(
            e.target.value
          )
        }
        className="border p-3 w-full rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

    </div>

  </div>

  {/* ================= COUNTING BOX ================= */}

  {overallSelectedItem ? (

    <div className="mt-5 border-2 border-indigo-500 rounded-2xl p-6 bg-indigo-50">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">

        {/* ITEM */}

        <div>

          <div className="text-sm text-gray-500 mb-1">
            Selected Item
          </div>

          <div className="text-xl font-bold">
            {overallSelectedItem}
          </div>

        </div>

        {/* QUANTITY */}

        <div className="text-center">

          <div className="text-sm text-gray-500 mb-1">

            {overallCountingPeriod ===
            'day'
              ? 'Daily Quantity'
              : overallCountingPeriod ===
                'weekly'
              ? 'Weekly Quantity'
              : 'Monthly Quantity'}

          </div>

          <div className="text-4xl font-bold text-indigo-600">

            {overallSelectedItemCount.toLocaleString()}

          </div>

          <div className="text-sm text-gray-500 mt-1">
            Quantity
          </div>

        </div>

        {/* AMOUNT */}

        <div className="text-center md:text-right">

          <div className="text-sm text-gray-500 mb-1">
            Total Amount
          </div>

          <div className="text-2xl font-bold text-green-600">

            Rs.{' '}
            {overallSelectedItemAmount.toLocaleString()}

          </div>

        </div>

      </div>

    </div>

  ) : (

    <div className="mt-5 text-center text-gray-500 border rounded-2xl p-8">
      Please select an item
    </div>

  )}

</div>

        {/* ================= ORDERS ================= */}

        {loading ? (

          <div>
            Loading...
          </div>

        ) : (

          <div className="space-y-6">

            {groupedOrders.map(
              (group: any) => {

                const groupItemCounting =
                  getItemCounting(
                    group.items
                  );

                return (

                  <div
                    key={group.groupKey}
                    className="bg-white rounded-xl shadow"
                  >

                    {/* HEADER */}

                    <div
                      onClick={() =>
                        toggleExpand(
                          group.groupKey
                        )
                      }
                      className="p-6 bg-indigo-600 text-white flex justify-between cursor-pointer"
                    >

                      <div className="flex gap-3 items-center">

                        <User />

                        <h2 className="text-xl">
                          {group.customerName}
                        </h2>

                      </div>

                      <div className="flex items-center gap-6">

                        <div className="text-right">

                          <p>
                            Total
                          </p>

                          <p className="font-bold">
                            Rs{' '}
                            {Number(
                              group.total
                            ).toLocaleString()}
                          </p>

                        </div>

                        {expandedOrders[
                          group.groupKey
                        ] ? (
                          <ChevronUp />
                        ) : (
                          <ChevronDown />
                        )}

                      </div>

                    </div>

                    {/* BODY */}

                    {expandedOrders[
                      group.groupKey
                    ] && (

                      <div className="p-6">

                        {/* ================= CUSTOMER ITEM COUNTING ================= */}

                        <div className="mb-6">

                          <h3 className="font-bold text-lg mb-3">
                            {group.customerName} - Item Counting
                          </h3>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

                            {Object.entries(
                              groupItemCounting
                            ).map(
                              ([
                                itemName,
                                quantity,
                              ]) => (

                                <div
                                  key={itemName}
                                  className="border rounded-xl p-3 bg-gray-50"
                                >

                                  <div className="font-semibold text-sm min-h-[40px]">
                                    {itemName}
                                  </div>

                                  <div className="text-xl font-bold text-indigo-600">
                                    {quantity}
                                  </div>

                                  <div className="text-xs text-gray-500">
                                    Quantity
                                  </div>

                                </div>

                              )
                            )}

                          </div>

                        </div>

                        {/* ================= TABLE HEADER ================= */}

                        <div className="grid grid-cols-5 gap-4 border-b font-bold pb-2 mb-2">

                          <div>
                            Date
                          </div>

                          <div>
                            Item
                          </div>

                          <div>
                            Qty/KG
                          </div>

                          <div>
                            Price
                          </div>

                          <div>
                            Total Price
                          </div>

                        </div>

                        {/* ================= TABLE ROWS ================= */}

                        {group.items.map(
                          (
                            item: any,
                            i: number
                          ) => (

                            <div
                              key={i}
                              className="grid grid-cols-5 gap-4 border-b py-2 items-center"
                            >

                              <div>
                                {new Date(
                                  item.orderDate
                                ).toLocaleDateString()}
                              </div>

                              <div>
                                {item.name}
                              </div>

                              <div>
                                {item.quantity}
                              </div>

                              <div>
                                Rs{' '}
                                {Number(
                                  item.price
                                ).toLocaleString()}
                              </div>

                              <div className="font-bold">
                                Rs{' '}
                                {(
                                  Number(
                                    item.price
                                  ) *
                                  Number(
                                    item.quantity
                                  )
                                ).toLocaleString()}
                              </div>

                            </div>

                          )
                        )}

                        {/* ================= CUSTOMER TOTAL ================= */}

                        <div className="border-t mt-5 pt-4 flex justify-between">

                          <span className="font-bold text-lg">
                            {group.customerName} Total
                          </span>

                          <span className="font-bold text-lg text-green-600">
                            Rs{' '}
                            {Number(
                              group.total
                            ).toLocaleString()}
                          </span>

                        </div>

                        {/* ================= ACTIONS ================= */}

                        <div className="flex justify-end gap-4 mt-6">

                          {/* EDIT */}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              handleEdit(
                                group
                              );
                            }}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-lg flex gap-2"
                          >

                            <Pencil
                              size={18}
                            />

                            Edit

                          </button>

                          {/* DELETE */}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              handleDelete(
                                group.customerName
                              );
                            }}
                            className="bg-red-600 text-white px-5 py-2 rounded-lg flex gap-2"
                          >

                            <Trash2
                              size={18}
                            />

                            Delete

                          </button>

                          {/* PRINT */}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              handlePrint(
                                group
                              );
                            }}
                            className="bg-green-600 text-white px-5 py-2 rounded-lg flex gap-2"
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

            {/* ================= NO ORDERS ================= */}

            {groupedOrders.length === 0 && (

              <div className="bg-white rounded-xl shadow p-10 text-center text-gray-500">

                No orders found for selected date range.

              </div>

            )}

          </div>

        )}

      </div>

      {/* ================= EDIT MODAL ================= */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">

            <div className="p-6 border-b">

              <h2 className="text-2xl font-bold">
                Edit Order
              </h2>

            </div>

            <div className="p-6">

              <label className="font-medium">
                Customer Name
              </label>

              <input
                type="text"
                value={
                  formData.customerName
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,

                    customerName:
                      e.target.value,
                  })
                }
                className="w-full border rounded-lg p-3 mt-2 mb-6"
              />

              <div className="space-y-4">

                {formData.items.map(
                  (item, index) => (

                    <div
                      key={index}
                      className="grid grid-cols-12 gap-3 items-center border rounded-lg p-3"
                    >

                      <input
                        value={item.name}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'name',
                            e.target.value
                          )
                        }
                        placeholder="Item Name"
                        className="col-span-5 border rounded-lg p-2"
                      />

                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'price',
                            Number(
                              e.target.value
                            )
                          )
                        }
                        placeholder="Price"
                        className="col-span-2 border rounded-lg p-2"
                      />

                      <input
                        type="number"
                        value={
                          item.quantity
                        }
                        onChange={(e) =>
                          updateItem(
                            index,
                            'quantity',
                            Number(
                              e.target.value
                            )
                          )
                        }
                        placeholder="Qty"
                        className="col-span-2 border rounded-lg p-2"
                      />

                      <div className="col-span-2 font-bold text-center">

                        Rs{' '}
                        {(
                          Number(
                            item.price
                          ) *
                          Number(
                            item.quantity
                          )
                        ).toLocaleString()}

                      </div>

                      <button
                        onClick={() =>
                          removeItem(
                            index
                          )
                        }
                        className="text-red-600 hover:text-red-800"
                      >

                        <Trash2
                          size={20}
                        />

                      </button>

                    </div>

                  )
                )}

              </div>

              {/* ADD ITEM */}

              <button
                onClick={addItem}
                className="mt-5 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg"
              >

                <Plus
                  size={18}
                />

                Add Item

              </button>

              {/* TOTAL */}

              <div className="mt-8 text-right">

                <h3 className="text-2xl font-bold">
                  Total: Rs{' '}
                  {Number(
                    formData.total
                  ).toLocaleString()}
                </h3>

              </div>

            </div>

            {/* MODAL BUTTONS */}

            <div className="border-t p-6 flex justify-end gap-3">

              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingOrder(null);
                }}
                className="bg-gray-500 text-white px-5 py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={
                  handleUpdateOrder
                }
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg"
              >
                Save Changes
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}