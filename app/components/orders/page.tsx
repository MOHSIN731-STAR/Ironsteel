'use client';

import { useEffect, useMemo, useState } from 'react';

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
  updatedAt?: string;
}

interface GroupedOrder {
  id: number;
  customerName: string;
  items: Item[];
  total: number;
  createdAt: string;
  updatedAt?: string;
  groupKey: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [editingOrder, setEditingOrder] =
    useState<GroupedOrder | null>(null);

  const [expandedOrders, setExpandedOrders] =
    useState<Record<string, boolean>>({});

  const [searchTerm, setSearchTerm] = useState('');

  // =========================================================
  // DATE FILTER
  // =========================================================

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // =========================================================
  // EDIT FORM
  // =========================================================

  const [formData, setFormData] = useState({
    customerName: '',
    items: [] as Item[],
    total: 0,
  });

  // =========================================================
  // OVERALL ITEM COUNTING
  // =========================================================

  const [overallSelectedItem, setOverallSelectedItem] =
    useState('');

  const [overallCountingPeriod, setOverallCountingPeriod] =
    useState<'day' | 'weekly' | 'monthly'>('day');

  const [overallCountingDate, setOverallCountingDate] =
    useState(
      new Date().toISOString().split('T')[0]
    );

  // =========================================================
  // ITEM TOTAL
  // =========================================================

  const calculateItemTotal = (item: Item) => {
    return (
      Number(item.price || 0) *
      Number(item.quantity || 0)
    );
  };

  // =========================================================
  // ITEMS TOTAL
  // =========================================================

  const calculateItemsTotal = (items: Item[]) => {
    return items.reduce(
      (sum, item) =>
        sum + calculateItemTotal(item),
      0
    );
  };

  // =========================================================
  // GROUP KEY
  // =========================================================

  const getGroupKey = (name: string) =>
    name.toLowerCase().trim();

  // =========================================================
  // FETCH ORDERS
  // =========================================================

  const fetchOrders = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        '/api/orders',
        {
          cache: 'no-store',
        }
      );

      const data = await res.json();

      if (data.success) {
        setOrders(data.orders || []);
      } else {
        console.error(
          data.message ||
            'Failed to fetch orders'
        );
      }
    } catch (error) {
      console.error(
        'Fetch orders error:',
        error
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

  const dateFilteredOrders =
    useMemo(() => {
      return orders.filter(
        (order) => {
          const orderDate =
            new Date(
              order.createdAt
            );

          if (fromDate) {
            const from =
              new Date(
                `${fromDate}T00:00:00`
              );

            if (
              orderDate < from
            ) {
              return false;
            }
          }

          if (toDate) {
            const to =
              new Date(
                `${toDate}T23:59:59.999`
              );

            if (
              orderDate > to
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      orders,
      fromDate,
      toDate,
    ]);

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredOrders =
    useMemo(() => {
      return dateFilteredOrders.filter(
        (order) =>
          order.customerName
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            )
      );
    }, [
      dateFilteredOrders,
      searchTerm,
    ]);

  // =========================================================
  // GROUP FILTERED ORDERS
  // =========================================================

  const groupedOrders =
    useMemo<GroupedOrder[]>(() => {
      const map =
        new Map<
          string,
          GroupedOrder
        >();

      filteredOrders.forEach(
        (order) => {
          const key =
            getGroupKey(
              order.customerName
            );

          const orderItems =
            (
              order.items || []
            ).map(
              (item) => ({
                ...item,
                orderDate:
                  order.createdAt,
              })
            );

          if (!map.has(key)) {
            map.set(key, {
              id: order.id,

              customerName:
                order.customerName,

              items: orderItems,

              /*
               * Use saved total for the group
               * when the group contains one order.
               *
               * This allows manually edited totals
               * to remain exactly as saved.
               */
              total:
                Number(
                  order.total || 0
                ),

              createdAt:
                order.createdAt,

              updatedAt:
                order.updatedAt,

              groupKey: key,
            });
          } else {
            const existing =
              map.get(key)!;

            existing.items = [
              ...existing.items,
              ...orderItems,
            ];

            /*
             * When multiple orders belong to
             * the same customer group, each order's
             * saved total is added once.
             *
             * Old totals are never added again.
             */
            existing.total +=
              Number(
                order.total || 0
              );
          }
        }
      );

      return Array.from(
        map.values()
      );
    }, [
      filteredOrders,
    ]);

  // =========================================================
  // ALL GROUPS
  //
  // Used for Overall Total.
  // =========================================================

  const allGroupedOrders =
    useMemo<GroupedOrder[]>(() => {
      const map =
        new Map<
          string,
          GroupedOrder
        >();

      orders.forEach(
        (order) => {
          const key =
            getGroupKey(
              order.customerName
            );

          const orderItems =
            (
              order.items || []
            ).map(
              (item) => ({
                ...item,
                orderDate:
                  order.createdAt,
              })
            );

          if (!map.has(key)) {
            map.set(key, {
              id: order.id,

              customerName:
                order.customerName,

              items: orderItems,

              total:
                Number(
                  order.total || 0
                ),

              createdAt:
                order.createdAt,

              updatedAt:
                order.updatedAt,

              groupKey: key,
            });
          } else {
            const existing =
              map.get(key)!;

            existing.items = [
              ...existing.items,
              ...orderItems,
            ];

            existing.total +=
              Number(
                order.total || 0
              );
          }
        }
      );

      return Array.from(
        map.values()
      );
    }, [orders]);

  // =========================================================
  // OVERALL TOTAL
  //
  // Example:
  //
  // A = 6000
  // B = 4000
  // New = 5000
  //
  // Overall = 15000
  // =========================================================

  const overallTotal =
    allGroupedOrders.reduce(
      (sum, group) =>
        sum +
        Number(
          group.total || 0
        ),
      0
    );

  // =========================================================
  // ITEM COUNTING
  // =========================================================

  const getItemCounting = (
    items: Item[]
  ) => {
    return items.reduce(
      (
        result: Record<
          string,
          number
        >,
        item
      ) => {
        const name =
          item.name.trim();

        if (!name) {
          return result;
        }

        result[name] =
          (result[name] || 0) +
          Number(
            item.quantity || 0
          );

        return result;
      },
      {}
    );
  };

  // =========================================================
  // AVAILABLE ITEMS
  // =========================================================

  const overallAvailableItems =
    useMemo(() => {
      return Array.from(
        new Set(
          orders.flatMap(
            (order) =>
              (
                order.items ||
                []
              )
                .map(
                  (item) =>
                    item.name.trim()
                )
                .filter(Boolean)
          )
        )
      ).sort();
    }, [orders]);

  useEffect(() => {
    if (
      overallAvailableItems.length >
        0 &&
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

  // =========================================================
  // OVERALL COUNTING DATE FILTER
  // =========================================================

  const overallCountingFilteredOrders =
    useMemo(() => {
      return orders.filter(
        (order) => {
          const orderDate =
            new Date(
              order.createdAt
            );

          const selectedDate =
            new Date(
              `${overallCountingDate}T00:00:00`
            );

          if (
            overallCountingPeriod ===
            'day'
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

          if (
            overallCountingPeriod ===
            'weekly'
          ) {
            const startOfWeek =
              new Date(
                selectedDate
              );

            const day =
              startOfWeek.getDay();

            const diff =
              day === 0
                ? -6
                : 1 - day;

            startOfWeek.setDate(
              startOfWeek.getDate() +
                diff
            );

            startOfWeek.setHours(
              0,
              0,
              0,
              0
            );

            const endOfWeek =
              new Date(
                startOfWeek
              );

            endOfWeek.setDate(
              endOfWeek.getDate() +
                6
            );

            endOfWeek.setHours(
              23,
              59,
              59,
              999
            );

            return (
              orderDate >=
                startOfWeek &&
              orderDate <=
                endOfWeek
            );
          }

          if (
            overallCountingPeriod ===
            'monthly'
          ) {
            return (
              orderDate.getFullYear() ===
                selectedDate.getFullYear() &&
              orderDate.getMonth() ===
                selectedDate.getMonth()
            );
          }

          return false;
        }
      );
    }, [
      orders,
      overallCountingDate,
      overallCountingPeriod,
    ]);

  // =========================================================
  // SELECTED ITEM COUNT
  // =========================================================

  const overallSelectedItemCount =
    overallCountingFilteredOrders.reduce(
      (sum, order) => {
        const items =
          (
            order.items ||
            []
          ).filter(
            (item) =>
              item.name.trim() ===
              overallSelectedItem
          );

        return (
          sum +
          items.reduce(
            (
              itemSum,
              item
            ) =>
              itemSum +
              Number(
                item.quantity || 0
              ),
            0
          )
        );
      },
      0
    );

  // =========================================================
  // SELECTED ITEM AMOUNT
  // =========================================================

  const overallSelectedItemAmount =
    overallCountingFilteredOrders.reduce(
      (sum, order) => {
        const items =
          (
            order.items ||
            []
          ).filter(
            (item) =>
              item.name.trim() ===
              overallSelectedItem
          );

        return (
          sum +
          items.reduce(
            (
              itemSum,
              item
            ) =>
              itemSum +
              calculateItemTotal(
                item
              ),
            0
          )
        );
      },
      0
    );

  // =========================================================
  // CLEAR DATE
  // =========================================================

  const clearDateFilter =
    () => {
      setFromDate('');
      setToDate('');
    };

  // =========================================================
  // TOGGLE GROUP
  // =========================================================

  const toggleExpand = (
    key: string
  ) => {
    setExpandedOrders(
      (previous) => ({
        ...previous,
        [key]:
          !previous[key],
      })
    );
  };

  // =========================================================
  // EDIT GROUP
  // =========================================================

  const handleEdit = (
    group: GroupedOrder
  ) => {
    const editItems =
      group.items.map(
        (item) => ({
          ...item,
        })
      );

    setEditingOrder(
      group
    );

    setFormData({
      customerName:
        group.customerName,

      items: editItems,

      /*
       * IMPORTANT:
       *
       * Use saved group total.
       * This is the value user can manually edit.
       */
      total:
        Number(
          group.total || 0
        ),
    });

    setShowModal(true);
  };

  // =========================================================
  // ADD ITEM
  // =========================================================

  const addItem = () => {
    setFormData(
      (previous) => ({
        ...previous,

        items: [
          ...previous.items,
          {
            name: '',
            price: 0,
            quantity: 1,
          },
        ],
      })
    );
  };

  // =========================================================
  // REMOVE ITEM
  // =========================================================

  const removeItem = (
    index: number
  ) => {
    setFormData(
      (previous) => ({
        ...previous,

        items:
          previous.items.filter(
            (_, itemIndex) =>
              itemIndex !==
              index
          ),
      })
    );
  };

  // =========================================================
  // UPDATE ITEM
  //
  // Item changes DO NOT overwrite manually
  // editable total.
  // =========================================================

  const updateItem = (
    index: number,
    field: keyof Item,
    value:
      | string
      | number
  ) => {
    setFormData(
      (previous) => {
        const updatedItems =
          [
            ...previous.items,
          ];

        updatedItems[index] = {
          ...updatedItems[index],
          [field]: value,
        };

        return {
          ...previous,
          items:
            updatedItems,
        };
      }
    );
  };

  // =========================================================
  // UPDATE TOTAL MANUALLY
  // =========================================================

  const updateFormTotal = (
    value: string
  ) => {
    const numberValue =
      value === ''
        ? 0
        : Number(value);

    setFormData(
      (previous) => ({
        ...previous,
        total:
          Number.isFinite(
            numberValue
          )
            ? numberValue
            : 0,
      })
    );
  };

  // =========================================================
  // UPDATE ORDER
  //
  // IMPORTANT:
  //
  // We send formData.total directly.
  //
  // We DO NOT replace it with
  // calculateItemsTotal(formData.items).
  //
  // Therefore user can edit:
  //
  // 11,400 -> 13,000
  //
  // and 13,000 is saved.
  // =========================================================

  const handleUpdateOrder =
    async () => {
      if (!editingOrder) {
        return;
      }

      const finalTotal =
        Number(
          formData.total
        );

      if (
        !Number.isFinite(
          finalTotal
        )
      ) {
        alert(
          'Please enter a valid total.'
        );

        return;
      }

      try {
        const res =
          await fetch(
            '/api/orders',
            {
              method: 'PUT',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                id: editingOrder.id,

                customerName:
                  formData.customerName,

                items:
                  formData.items,

                /*
                 * VERY IMPORTANT:
                 *
                 * Send manually edited total.
                 */
                total:
                  finalTotal,
              }),
            }
          );

        const data =
          await res.json();

        if (data.success) {
          setShowModal(false);

          setEditingOrder(
            null
          );

          /*
           * Fetch from API again.
           *
           * Since total was saved to database,
           * refresh will show the same value.
           */
          await fetchOrders();

          alert(
            'Updated Successfully'
          );
        } else {
          alert(
            data.message ||
              'Update failed'
          );
        }
      } catch (error) {
        console.error(
          'Update error:',
          error
        );

        alert(
          'Something went wrong while updating order.'
        );
      }
    };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (
    customerName: string
  ) => {
    if (
      !confirm(
        `Delete all orders of ${customerName}?`
      )
    ) {
      return;
    }

    try {
      const res =
        await fetch(
          '/api/orders',
          {
            method: 'DELETE',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              customerName,
            }),
          }
        );

      const data =
        await res.json();

      if (data.success) {
        await fetchOrders();

        alert(
          'Orders deleted successfully'
        );
      } else {
        alert(
          data.message ||
            'Delete failed'
        );
      }
    } catch (error) {
      console.error(
        'Delete error:',
        error
      );

      alert(
        'Something went wrong while deleting.'
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

    /*
     * Print the SAME saved group total
     * that is displayed on screen.
     */
    const printTotal =
      Number(
        group.total || 0
      );

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

    const itemsHTML =
      group.items
        .map(
          (item) => `
            <div class="bill-row">

              <span class="item-name">
                ${item.name}
              </span>

              <span class="price">
                ${Number(
                  item.price || 0
                ).toLocaleString()}
              </span>

              <span class="qty">
                ${item.quantity}
              </span>

              <span class="total">
                ${calculateItemTotal(
                  item
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
          ${group.customerName}
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
            line-height: 1.6;
            margin-bottom: 10px;
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
            padding: 5px 0;
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
          }

          .shop-number,
          .sign {
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
            Rs ${printTotal.toLocaleString()}
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

    printWindow.onload =
      () => {
        printWindow.focus();

        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 300);
      };
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-7xl mx-auto">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">

          <h1 className="text-3xl font-bold">
            All Orders
          </h1>

          <div className="relative w-full md:w-80">

            <Search
              className="absolute left-3 top-3 text-gray-400"
              size={20}
            />

            <input
              className="w-full pl-10 py-2 border rounded-xl"
              placeholder="Search customer..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {/* =====================================================
            DATE FILTER
        ===================================================== */}

        <div className="bg-white rounded-2xl shadow p-5 mb-6">

          <div className="flex flex-col md:flex-row gap-4 items-end">

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
                className="w-full border p-3 rounded-xl"
              />

            </div>

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
                className="w-full border p-3 rounded-xl"
              />

            </div>

            <button
              onClick={
                clearDateFilter
              }
              className="px-5 py-3 bg-gray-200 rounded-xl hover:bg-gray-300"
            >
              Clear Date
            </button>

          </div>

        </div>

        {/* =====================================================
            OVERALL SUMMARY
        ===================================================== */}

        <div className="bg-white rounded-2xl shadow p-6 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div className="border rounded-2xl p-5 bg-indigo-50">

              <div className="text-sm text-gray-500 mb-1">
                Overall Total
              </div>

              <div className="text-3xl font-bold text-indigo-600">

                Rs{' '}

                {overallTotal.toLocaleString()}

              </div>

              <div className="text-sm text-gray-500 mt-2">
                All current customer groups combined
              </div>

            </div>

            <div className="border rounded-2xl p-5 bg-green-50">

              <div className="text-sm text-gray-500 mb-1">
                Customer Groups
              </div>

              <div className="text-3xl font-bold text-green-600">

                {
                  allGroupedOrders.length
                }

              </div>

              <div className="text-sm text-gray-500 mt-2">
                Current groups
              </div>

            </div>

            <div className="border rounded-2xl p-5 bg-gray-50">

              <div className="text-sm text-gray-500 mb-1">
                Total Orders
              </div>

              <div className="text-3xl font-bold text-gray-700">

                {
                  orders.length
                }

              </div>

              <div className="text-sm text-gray-500 mt-2">
                All saved orders
              </div>

            </div>

          </div>

        </div>

        {/* =====================================================
            OVERALL ITEM COUNTING
        ===================================================== */}

        <div className="bg-white rounded-2xl shadow p-6 mb-6">

          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-5">

            <h2 className="text-2xl font-bold">
              Overall Item Counting
            </h2>

            <div className="font-semibold">

              Total Orders:

              <span className="text-indigo-600 ml-2">
                {
                  overallCountingFilteredOrders.length
                }
              </span>

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

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
                className="border p-3 w-full rounded-xl bg-white"
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

            <div>

              <label className="block text-sm font-semibold mb-2">
                Counting Period
              </label>

              <select
                value={
                  overallCountingPeriod
                }
                onChange={(e) =>
                  setOverallCountingPeriod(
                    e.target.value as
                      | 'day'
                      | 'weekly'
                      | 'monthly'
                  )
                }
                className="border p-3 w-full rounded-xl bg-white"
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

            <div>

              <label className="block text-sm font-semibold mb-2">
                Select Date
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
                className="border p-3 w-full rounded-xl bg-white"
              />

            </div>

          </div>

          {overallSelectedItem ? (

            <div className="mt-5 border-2 border-indigo-500 rounded-2xl p-6 bg-indigo-50">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <div>

                  <div className="text-sm text-gray-500 mb-1">
                    Selected Item
                  </div>

                  <div className="text-xl font-bold">
                    {
                      overallSelectedItem
                    }
                  </div>

                </div>

                <div className="text-center">

                  <div className="text-sm text-gray-500 mb-1">
                    Quantity
                  </div>

                  <div className="text-4xl font-bold text-indigo-600">

                    {
                      overallSelectedItemCount.toLocaleString()
                    }

                  </div>

                </div>

                <div className="text-center md:text-right">

                  <div className="text-sm text-gray-500 mb-1">
                    Total Amount
                  </div>

                  <div className="text-2xl font-bold text-green-600">

                    Rs.{' '}

                    {
                      overallSelectedItemAmount.toLocaleString()
                    }

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

        {/* =====================================================
            ORDERS
        ===================================================== */}

        {loading ? (

          <div className="bg-white rounded-xl shadow p-10 text-center">
            Loading...
          </div>

        ) : (

          <div className="space-y-6">

            {groupedOrders.map(
              (group) => {

                const itemCounting =
                  getItemCounting(
                    group.items
                  );

                /*
                 * IMPORTANT:
                 *
                 * Use saved/editable group total.
                 */
                const currentGroupTotal =
                  Number(
                    group.total || 0
                  );

                return (

                  <div
                    key={
                      group.groupKey
                    }
                    className="bg-white rounded-xl shadow overflow-hidden"
                  >

                    {/* =================================================
                        GROUP HEADER
                    ================================================= */}

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

                        <h2 className="text-xl font-bold">

                          {
                            group.customerName
                          }

                        </h2>

                      </div>

                      <div className="flex items-center gap-6">

                        <div className="text-right">

                          <p className="text-sm">
                            Total
                          </p>

                          <p className="font-bold text-lg">

                            Rs{' '}

                            {
                              currentGroupTotal.toLocaleString()
                            }

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

                    {/* =================================================
                        GROUP BODY
                    ================================================= */}

                    {expandedOrders[
                      group.groupKey
                    ] && (

                      <div className="p-6">

                        {/* ITEM COUNTING */}

                        <div className="mb-6">

                          <h3 className="font-bold text-lg mb-3">

                            {
                              group.customerName
                            }

                            {' '} - Item Counting

                          </h3>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

                            {Object.entries(
                              itemCounting
                            ).map(
                              ([
                                itemName,
                                quantity,
                              ]) => (

                                <div
                                  key={
                                    itemName
                                  }
                                  className="border rounded-xl p-3 bg-gray-50"
                                >

                                  <div className="font-semibold text-sm min-h-[40px]">

                                    {
                                      itemName
                                    }

                                  </div>

                                  <div className="text-xl font-bold text-indigo-600">

                                    {
                                      quantity
                                    }

                                  </div>

                                  <div className="text-xs text-gray-500">
                                    Quantity
                                  </div>

                                </div>

                              )
                            )}

                          </div>

                        </div>

                        {/* TABLE HEADER */}

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

                        {/* ITEMS */}

                        {group.items.map(
                          (
                            item,
                            index
                          ) => (

                            <div
                              key={`${group.groupKey}-${index}`}
                              className="grid grid-cols-5 gap-4 border-b py-2 items-center"
                            >

                              <div>

                                {item.orderDate
                                  ? new Date(
                                      item.orderDate
                                    ).toLocaleDateString()
                                  : '-'}

                              </div>

                              <div>
                                {
                                  item.name
                                }
                              </div>

                              <div>
                                {
                                  item.quantity
                                }
                              </div>

                              <div>

                                Rs{' '}

                                {Number(
                                  item.price ||
                                    0
                                ).toLocaleString()}

                              </div>

                              <div className="font-bold">

                                Rs{' '}

                                {calculateItemTotal(
                                  item
                                ).toLocaleString()}

                              </div>

                            </div>

                          )
                        )}

                        {/* =================================================
                            CUSTOMER TOTAL
                        ================================================= */}

                        <div className="border-t mt-5 pt-4 flex justify-between items-center">

                          <span className="font-bold text-lg">

                            {
                              group.customerName
                            }

                            {' '} Total

                          </span>

                          <span className="font-bold text-lg text-green-600">

                            Rs{' '}

                            {
                              currentGroupTotal.toLocaleString()
                            }

                          </span>

                        </div>

                        {/* =================================================
                            ACTION BUTTONS
                        ================================================= */}

                        <div className="flex justify-end gap-3 mt-6">

                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              handleEdit(
                                group
                              );
                            }}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                          >

                            <Pencil
                              size={18}
                            />

                            Edit

                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              handleDelete(
                                group.customerName
                              );
                            }}
                            className="bg-red-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
                          >

                            <Trash2
                              size={18}
                            />

                            Delete

                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              handlePrint(
                                group
                              );
                            }}
                            className="bg-green-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
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

            {groupedOrders.length ===
              0 && (

              <div className="bg-white rounded-xl shadow p-10 text-center text-gray-500">

                No orders found.

              </div>

            )}

          </div>

        )}

      </div>

      {/* =========================================================
          EDIT MODAL
      ========================================================= */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="p-6 border-b flex justify-between items-center">

              <h2 className="text-2xl font-bold">
                Edit Order
              </h2>

              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingOrder(
                    null
                  );
                }}
                className="text-gray-500 hover:text-red-600 text-2xl"
              >
                ×
              </button>

            </div>

            {/* =================================================
                MODAL BODY
            ================================================= */}

            <div className="p-6">

              {/* CUSTOMER NAME */}

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
                    setFormData(
                      (previous) => ({
                        ...previous,

                        customerName:
                          e.target.value,
                      })
                    )
                  }
                  className="w-full border-2 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

              </div>

              {/* ITEMS */}

              <div>

                <div className="flex justify-between items-center mb-4">

                  <h3 className="text-xl font-bold">
                    Items
                  </h3>

                  <button
                    onClick={
                      addItem
                    }
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                  >

                    <Plus
                      size={18}
                    />

                    Add Item

                  </button>

                </div>

                <div className="space-y-3">

                  {formData.items.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        key={index}
                        className="grid grid-cols-12 gap-3 items-center border rounded-xl p-3"
                      >

                        {/* ITEM */}

                        <div className="col-span-12 md:col-span-4">

                          <label className="text-xs text-gray-500">
                            Item
                          </label>

                          <input
                            value={
                              item.name
                            }
                            onChange={(e) =>
                              updateItem(
                                index,
                                'name',
                                e.target.value
                              )
                            }
                            placeholder="Item Name"
                            className="w-full border rounded-lg p-2"
                          />

                        </div>

                        {/* PRICE */}

                        <div className="col-span-6 md:col-span-2">

                          <label className="text-xs text-gray-500">
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
                                'price',
                                Number(
                                  e.target.value
                                )
                              )
                            }
                            className="w-full border rounded-lg p-2"
                          />

                        </div>

                        {/* QUANTITY */}

                        <div className="col-span-6 md:col-span-2">

                          <label className="text-xs text-gray-500">
                            Qty/KG
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
                                'quantity',
                                Number(
                                  e.target.value
                                )
                              )
                            }
                            className="w-full border rounded-lg p-2"
                          />

                        </div>

                        {/* CALCULATED ITEM TOTAL */}

                        <div className="col-span-10 md:col-span-3">

                          <label className="text-xs text-gray-500">
                            Item Total
                          </label>

                          <div className="font-bold text-green-600 border rounded-lg p-2 bg-green-50">

                            Rs{' '}

                            {calculateItemTotal(
                              item
                            ).toLocaleString()}

                          </div>

                        </div>

                        {/* DELETE */}

                        <div className="col-span-2 md:col-span-1 flex justify-center">

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

                      </div>

                    )
                  )}

                </div>

              </div>

              {/* =================================================
                  EDITABLE TOTAL
              ================================================= */}

              <div className="mt-8 border-2 border-indigo-500 rounded-2xl p-5 bg-indigo-50">

                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">

                  <div>

                    <h3 className="text-xl font-bold">
                      Total
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      You can manually change this total.
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
                        updateFormTotal(
                          e.target.value
                        )
                      }
                      className="w-56 border-2 border-indigo-500 rounded-xl px-4 py-3 text-2xl font-bold text-right bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                  </div>

                </div>

              </div>

              {/* =================================================
                  CALCULATED ITEMS TOTAL
              ================================================= */}

              <div className="mt-4 flex justify-between items-center bg-gray-50 rounded-xl p-4">

                <span className="font-semibold text-gray-600">
                  Items Calculated Total
                </span>

                <span className="font-bold text-gray-700">

                  Rs{' '}

                  {calculateItemsTotal(
                    formData.items
                  ).toLocaleString()}

                </span>

              </div>

            </div>

            {/* =================================================
                MODAL FOOTER
            ================================================= */}

            <div className="border-t p-6 flex justify-end gap-3">

              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingOrder(
                    null
                  );
                }}
                className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600"
              >
                Cancel
              </button>

              <button
                onClick={
                  handleUpdateOrder
                }
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
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