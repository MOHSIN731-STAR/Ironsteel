'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Edit, Trash2, RefreshCw, X, Printer } from 'lucide-react';

interface Item {
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface WalkingOrder {
  id: number;
  customerName: string;
  items: Item[];
  total: number;
  createdAt: string;
}

export default function WalkingOrdersPage() {
  const [orders, setOrders] = useState<WalkingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [grandTotal, setGrandTotal] = useState<number>(0);

  const [hoveredOrder, setHoveredOrder] =
    useState<WalkingOrder | null>(null);

  const [editingOrder, setEditingOrder] =
    useState<WalkingOrder | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const ignoreHover = useRef(false);

  // ================= FETCH ORDERS =================

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/walking');

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();

      console.log('📡 API Response:', data);

      let ordersArray: WalkingOrder[] = [];

      if (Array.isArray(data)) {
        ordersArray = data;
      } else if (
        data.success &&
        Array.isArray(data.walkingOrders)
      ) {
        ordersArray = data.walkingOrders;
      } else {
        throw new Error('Invalid response format from API');
      }

      setOrders(ordersArray);
    } catch (err: any) {
      console.error('Fetch Error:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ================= GRAND TOTAL =================

  useEffect(() => {
    const total = items.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
          Number(item.quantity),
      0
    );

    setGrandTotal(total);
  }, [items]);

  // ================= DELETE =================

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this order?'
      )
    ) {
      return;
    }

    setDeletingId(id);

    try {
      const res = await fetch('/api/walking', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: id,
        }),
      });

      const data = await res.json();

      console.log('Delete Response:', data);

      if (res.ok && data.success) {
        fetchOrders();
      } else {
        alert(
          data.error ||
            'Failed to delete order'
        );
      }
    } catch (error) {
      console.error('Delete Error:', error);
      alert(
        'Something went wrong while deleting'
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ================= EDIT =================

  const handleEdit = (
    order: WalkingOrder
  ) => {
    setEditingOrder(order);
    setCustomerName(order.customerName);
    setItems([...order.items]);
    setGrandTotal(order.total);
  };

  // ================= UPDATE ITEM =================

  const updateItem = (
    index: number,
    field: keyof Item,
    value: any
  ) => {
    const updated = [...items];

    updated[index] = {
      ...updated[index],
      [field]:
        field === 'name'
          ? value
          : Number(value),
    };

    updated[index].total =
      Number(updated[index].price) *
      Number(updated[index].quantity);

    setItems(updated);
  };

  // ================= UPDATE =================

  const handleUpdate = async () => {
    if (!editingOrder) return;

    try {
      const res = await fetch('/api/walking', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: editingOrder.id,
          customerName,
          items,
          total: grandTotal,
        }),
      });

      const data = await res.json();

      console.log('Update Response:', data);

      if (res.ok && data.success) {
        setEditingOrder(null);
        fetchOrders();

        alert(
          'Order updated successfully!'
        );
      } else {
        alert(
          data.error || 'Update failed'
        );
      }
    } catch (error) {
      console.error(error);
      alert('Update request failed');
    }
  };

  // ================= DELETE ITEM FROM TOOLTIP =================

  const deleteTooltipItem = async (
    index: number
  ) => {
    if (!hoveredOrder) return;

    const updatedItems =
      hoveredOrder.items.filter(
        (_, i) => i !== index
      );

    const updatedTotal =
      updatedItems.reduce(
        (sum, item) =>
          sum +
          Number(item.price) *
            Number(item.quantity),
        0
      );

    try {
      const res = await fetch('/api/walking', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: hoveredOrder.id,
          customerName:
            hoveredOrder.customerName,
          items: updatedItems,
          total: updatedTotal,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setHoveredOrder({
          ...hoveredOrder,
          items: updatedItems,
          total: updatedTotal,
        });

        fetchOrders();
      } else {
        alert(
          data.error || 'Delete failed'
        );
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  };

  // ================= PRINT ORDER =================

  const handlePrint = (
    order: WalkingOrder
  ) => {
    setHoveredOrder(null);

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
      new Date(
        order.createdAt
      ).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

    const itemsHTML = order.items
      .map(
        (item) => `
          <div class="bill-row">
            <span class="item-name">
              ${item.name}
            </span>

            <span class="price">
              ${Number(item.price).toLocaleString()}
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
          <title>Walking Order #${order.id}</title>

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

            .receipt {
              width: 100%;
            }

            .shop-name {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }

            .order-info {
              margin-bottom: 10px;
              line-height: 1.6;
            }

            .line {
              border-top: 1px solid #000;
              margin: 7px 0;
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
              align-items: flex-start;
            }

            .item-name {
              width: 30%;
              word-break: break-word;
            }

            .price {
              width: 23%;
              text-align: right;
              word-break: break-word;
            }

            .qty {
              width: 18%;
              text-align: right;
              word-break: break-word;
            }

            .total {
              width: 29%;
              text-align: right;
              word-break: break-word;
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
              text-align: center;
              line-height: 1.5;
            }

            .shop-number {
              font-weight: 25px;
              margin-bottom: 5px;
            }

            .sign {
              margin-top: 8px;
              text-align: left;
            }

            .address {
              margin-top: 12px;
              font-size: 14px;
              font-weight: bold;
            }
          </style>
        </head>

        <body>

          <div class="receipt">

            <div class="shop-name">
              بسم اللہ آئرن سٹور
            </div>

            <div class="order-info">
              <div>
                <strong>Name:</strong>
                ${order.customerName}
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
                Qty
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
                Rs. ${Number(
                  order.total
                ).toLocaleString()}
              </span>
            </div>

            <div class="flex flex-2 justify-between mt-4">
             <div class="flex flex-row gap-2">
              <div class="shop-number">
                Shop Number
              </div>

              <div>
                0307-1038571
              </div>

              <div class="sign">
                Sign: _____________
              </div>
</div>
              <div class="address">
                بسم اللہ آئرن سٹور
                جمالپور نزد ماہر والا
                پٹرول پمپ قائم پور روڈ
              </div>

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

  // ================= HOVER TOOLTIP =================

  const handleEnter = (
    order: WalkingOrder
  ) => {
    if (ignoreHover.current) return;

    if (hoverTimeout.current) {
      clearTimeout(
        hoverTimeout.current
      );
    }

    setHoveredOrder(order);
  };

  const handleLeave = () => {
    hoverTimeout.current =
      setTimeout(() => {
        setHoveredOrder(null);
      }, 150);
  };

  // ================= FILTER =================

  const filteredOrders =
    orders.filter((o) =>
      o.customerName
        .toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        )
    );

  // ================= UI =================

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex justify-between items-center mb-6">

          <h1 className="text-3xl font-bold">
            Walking Orders
          </h1>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 border px-4 py-2 rounded-lg bg-white hover:bg-gray-100 transition"
          >
            <RefreshCw className="w-4 h-4" />

            Refresh
          </button>

        </div>

        {/* SEARCH */}

        <input
          className="border p-3 w-full mb-5 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search customer..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(
              e.target.value
            )
          }
        />

        {/* ERROR */}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* TABLE */}

        <div className="bg-white rounded-2xl shadow overflow-hidden">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>

                <th className="p-4 text-left">
                  Date
                </th>

                <th className="p-4 text-left">
                  Customer
                </th>

                <th className="p-4 text-left">
                  Items
                </th>

                <th className="p-4 text-right">
                  Total
                </th>

                <th className="p-4 text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredOrders.map(
                (order) => (

                  <tr
                    key={order.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                    onMouseEnter={() =>
                      handleEnter(order)
                    }
                    onMouseLeave={
                      handleLeave
                    }
                  >

                    {/* DATE */}

                    <td className="p-4 text-sm">

                      {new Date(
                        order.createdAt
                      ).toLocaleDateString()}

                    </td>

                    {/* CUSTOMER */}

                    <td className="p-4 font-semibold">

                      {order.customerName}

                    </td>

                    {/* ITEMS */}

                    <td className="p-4 text-gray-500">

                      {order.items.length}{' '}
                      items

                    </td>

                    {/* TOTAL */}

                    <td className="p-4 text-right font-bold text-green-600">

                      Rs.{' '}
                      {Number(
                        order.total
                      ).toLocaleString()}

                    </td>

                    {/* ACTIONS */}

                    <td className="p-4">

                      <div className="flex justify-center gap-4">

                        {/* EDIT */}

                        <button
                          onMouseDown={() =>
                            (ignoreHover.current =
                              true)
                          }
                          onMouseUp={() =>
                            (ignoreHover.current =
                              false)
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(order);
                          }}
                          className="text-blue-600 hover:scale-110 transition"
                          title="Edit Order"
                        >
                          <Edit size={20} />
                        </button>

                        {/* DELETE */}

                        <button
                          onMouseDown={() =>
                            (ignoreHover.current =
                              true)
                          }
                          onMouseUp={() =>
                            (ignoreHover.current =
                              false)
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(
                              order.id
                            );
                          }}
                          disabled={
                            deletingId ===
                            order.id
                          }
                          className="text-red-600 hover:scale-110 transition disabled:opacity-50"
                          title="Delete Order"
                        >
                          <Trash2 size={20} />
                        </button>

                        {/* PRINT */}

                        <button
                          onMouseDown={() =>
                            (ignoreHover.current =
                              true)
                          }
                          onMouseUp={() =>
                            (ignoreHover.current =
                              false)
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(order);
                          }}
                          className="text-green-600 hover:scale-110 transition"
                          title="Print Order"
                        >
                          <Printer size={20} />
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

          {/* NO ORDERS */}

          {!loading &&
            filteredOrders.length === 0 &&
            !error && (
              <div className="p-10 text-center text-gray-500">
                No orders found
              </div>
            )}

          {/* LOADING */}

          {loading && (
            <div className="p-10 text-center text-gray-500">
              Loading orders...
            </div>
          )}

        </div>

      </div>

      {/* ================= TOOLTIP / ORDER ITEMS ================= */}

      {hoveredOrder && (

        <div
          className="fixed inset-0 bg-black/30 z-50 pointer-events-none"
          onMouseEnter={() =>
            hoverTimeout.current &&
            clearTimeout(
              hoverTimeout.current
            )
          }
          onMouseLeave={
            handleLeave
          }
        >

          <div className="flex items-center justify-center w-full h-full">

            <div className="bg-white w-[420px] p-5 rounded-2xl shadow-2xl pointer-events-auto relative">

              {/* CLOSE */}

              <button
                onClick={() =>
                  setHoveredOrder(null)
                }
                className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="font-bold text-xl mb-4">
                Order Items
              </h2>

              <div className="space-y-3 max-h-64 overflow-auto">

                {hoveredOrder.items.map(
                  (item, i) => (

                    <div
                      key={i}
                      className="flex justify-between items-center border-b pb-2"
                    >

                      <div>

                        <div className="font-medium">
                          {item.name}
                        </div>

                        <div className="text-xs text-gray-500">
                          {item.quantity} × Rs.{' '}
                          {item.price}
                        </div>

                      </div>

                      <div className="flex items-center gap-3">

                        <div className="font-semibold">
                          Rs.{' '}
                          {Number(
                            item.quantity *
                              item.price
                          ).toLocaleString()}
                        </div>

                        <button
                          onClick={() =>
                            deleteTooltipItem(
                              i
                            )
                          }
                          className="text-red-600 hover:text-red-800"
                          title="Delete Item"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

              {/* TOTAL */}

              <div className="mt-5 pt-3 border-t flex justify-between font-bold text-lg">

                <span>
                   Total Price
                </span>

                <span className="text-green-600">
                  Rs.{' '}
                  {Number(
                    hoveredOrder.total
                  ).toLocaleString()}
                </span>

              </div>

              {/* PRINT FROM POPUP */}

              <button
                onClick={() =>
                  handlePrint(
                    hoveredOrder
                  )
                }
                className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 transition"
              >
                <Printer size={18} />

                Print Order

              </button>

            </div>

          </div>

        </div>

      )}

      {/* ================= EDIT MODAL ================= */}

      {editingOrder && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-[650px] p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-auto">

            <h2 className="text-2xl font-bold mb-5">
              Update Order
            </h2>

            {/* CUSTOMER */}

            <input
              className="border p-3 w-full mb-5 rounded-xl"
              value={customerName}
              onChange={(e) =>
                setCustomerName(
                  e.target.value
                )
              }
              placeholder="Customer Name"
            />

            {/* ITEMS */}

            <div className="space-y-3 max-h-72 overflow-auto mb-5">

              {items.map(
                (item, index) => (

                  <div
                    key={index}
                    className="grid grid-cols-4 gap-3"
                  >

                    {/* NAME */}

                    <input
                      className="border p-2 rounded-lg"
                      value={item.name}
                      onChange={(e) =>
                        updateItem(
                          index,
                          'name',
                          e.target.value
                        )
                      }
                    />

                    {/* PRICE */}

                    <input
                      className="border p-2 rounded-lg"
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(
                          index,
                          'price',
                          e.target.value
                        )
                      }
                    />

                    {/* QUANTITY */}

                    <input
                      className="border p-2 rounded-lg"
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          'quantity',
                          e.target.value
                        )
                      }
                    />

                    {/* ITEM TOTAL */}

                    <div className="p-2 font-bold flex items-center">

                      Rs.{' '}
                      {Number(
                        item.price *
                          item.quantity
                      ).toLocaleString()}

                    </div>

                  </div>

                )
              )}

            </div>

            {/* GRAND TOTAL */}

            <div className="flex justify-between font-bold text-xl border-t pt-4 mb-6">

              <span>
                Grand Total
              </span>

              <input
                type="number"
                className="border p-2 rounded-lg w-40 text-right font-bold text-green-600"
                value={grandTotal}
                onChange={(e) =>
                  setGrandTotal(
                    Number(
                      e.target.value
                    )
                  )
                }
              />

            </div>

            {/* BUTTONS */}

            <div className="flex justify-end gap-3">

              <button
                onClick={() =>
                  setEditingOrder(null)
                }
                className="px-5 py-2 border rounded-xl hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Update Order
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}