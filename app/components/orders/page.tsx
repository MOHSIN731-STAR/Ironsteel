'use client';

import { useEffect, useState } from 'react';
import {
  Pencil,
  Trash2,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Item {
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Order {
  id: string;
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
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    customerName: '',
    items: [] as Item[],
    total: 0,
  });

  const [lockedTotals, setLockedTotals] = useState<Record<string, number>>({});

  // ================= FETCH =================
  const fetchOrders = async () => {
    setLoading(true);
    const res = await fetch('/api/orders', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setOrders(data.orders || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ================= TOGGLE EXPAND =================
  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // ================= GROUP ORDERS =================
const groupedOrders = Array.from(
  orders.reduce((map, order) => {
    const key = order.customerName.toLowerCase();

    const orderTotal = lockedTotals[order.id] ?? order.total;

    if (!map.has(key)) {
      map.set(key, {
        ...order,
        items: [...(order.items || [])],
        total: orderTotal,
      });
    } else {
      const existing = map.get(key);

      existing.items = [
        ...existing.items,
        ...(order.items || []),
      ];

      // ✅ IMPORTANT FIX: add totals instead of overwrite
      existing.total =
        (lockedTotals[existing.id] ?? existing.total) + orderTotal;
    }

    return map;
  }, new Map<string, any>()).values()
);

  // ================= EDIT =================
  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      customerName: order.customerName,
      items: order.items,
      total: order.total,
    });
    setShowModal(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    await fetch('/api/orders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    fetchOrders();
  };

  // ================= ITEM CHANGE =================
  const handleItemChange = (index: number, field: keyof Item, value: any) => {
    const updated = [...formData.items];

    updated[index] = {
      ...updated[index],
      [field]: field === 'name' ? value : Number(value),
    };

    updated[index].total = updated[index].price * updated[index].quantity;

    const newTotal = updated.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    setFormData((prev) => ({
      ...prev,
      items: updated,
      total: newTotal,
    }));
  };

  // ================= DELETE ITEM =================
  const handleDeleteItem = (index: number) => {
    const updated = formData.items.filter((_, i) => i !== index);

    const newTotal = updated.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    setFormData((prev) => ({
      ...prev,
      items: updated,
      total: newTotal,
    }));
  };

  // ================= TOTAL CHANGE =================
  const handleTotalChange = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      total: value,
    }));

    if (editingOrder) {
      setLockedTotals((prev) => ({
        ...prev,
        [editingOrder.id]: value,
      }));
    }
  };

  // ================= UPDATE ORDER =================
  const handleUpdate = async () => {
    if (!editingOrder) return;

    await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: editingOrder.id,
        customerName: formData.customerName,
        items: formData.items,
        total: formData.total,
      }),
    });

    setShowModal(false);
    setEditingOrder(null);
    fetchOrders();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">All Orders</h1>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedOrders.map((order: any) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl shadow-lg overflow-hidden"
              >
                {/* Clickable Header - Name + Grand Total */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center cursor-pointer hover:brightness-105 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <User size={28} />
                    <div>
                      <h2 className="text-2xl font-bold">{order.customerName}</h2>
                      <p className="text-sm opacity-75">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm opacity-75">Grand Total</p>
                      <p className="text-4xl font-black">Rs. {order.total}</p>
                    </div>
                    {expandedOrders[order.id] ? (
                      <ChevronUp size={28} />
                    ) : (
                      <ChevronDown size={28} />
                    )}
                  </div>
                </div>

                {/* Expandable Items Table */}
                {expandedOrders[order.id] && (
                  <div className="p-6">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-4 px-4 text-gray-600 font-medium">Item Name</th>
                          <th className="text-right py-4 px-4 text-gray-600 font-medium">Price</th>
                          <th className="text-center py-4 px-4 text-gray-600 font-medium">Quantity</th>
                          <th className="text-right py-4 px-4 text-gray-600 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items?.map((item: any, i: number) => (
                          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="py-4 px-4 font-medium">{item.name}</td>
                            <td className="py-4 px-4 text-right font-semibold">
                              Rs. {item.price}
                            </td>
                            <td className="py-4 px-4 text-center font-semibold">
                              {item.quantity}
                            </td>
                            <td className="py-4 px-4 text-right font-black text-green-600">
                              Rs. {item.total || item.price * item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 mt-6">
                      <button
                        onClick={() => handleEdit(order)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition"
                      >
                        <Pencil size={18} />
                        Edit Order
                      </button>

                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="bg-red-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-red-700 transition"
                      >
                        <Trash2 size={18} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= EDIT MODAL ================= */}
      {showModal && editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-[650px] p-6 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-5">Update Order</h2>

            <input
              className="border border-gray-300 p-3 w-full rounded-xl mb-4 focus:outline-none focus:border-indigo-500"
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              placeholder="Customer Name"
            />

            {/* Items List */}
            <div className="max-h-80 overflow-auto border rounded-xl p-4 bg-gray-50 mb-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-5 gap-3 items-center mb-3">
                  <input
                    className="border p-2 rounded-lg"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                  />
                  <input
                    className="border p-2 rounded-lg"
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                  />
                  <input
                    className="border p-2 rounded-lg"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  />
                  <div className="font-bold text-center">
                    Rs. {item.price * item.quantity}
                  </div>
                  <button
                    onClick={() => handleDeleteItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-center font-bold text-xl border-t pt-4">
              <span>Grand Total</span>
              <input
                type="number"
                value={formData.total}
                onChange={(e) => handleTotalChange(Number(e.target.value))}
                className="border p-3 w-40 text-right text-2xl text-green-600 rounded-xl focus:outline-none focus:border-green-500"
              />
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingOrder(null);
                }}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
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