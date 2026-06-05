'use client';

import { useEffect, useState } from 'react';
import {
  Pencil,
  Trash2,
  User,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';

interface Item {
  name: string;
  price: number;
  quantity: number;
  total?: number;
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
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    items: [] as Item[],
    total: 0,
  });

  // ================= FETCH ORDERS =================
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getGroupKey = (customerName: string) => customerName.toLowerCase().trim();

  // ================= GROUPED ORDERS =================
  const groupedOrders = Array.from(
    orders.reduce((map, order) => {
      const key = getGroupKey(order.customerName);

      if (!map.has(key)) {
        map.set(key, {
          ...order,
          groupKey: key,
          items: order.items.map((item: any) => ({
            ...item,
            orderDate: order.createdAt,
          })),
          total: Number(order.total),
        });
      } else {
        const existing = map.get(key)!;
        existing.items = [...existing.items, ...order.items.map((item: any) => ({
          ...item,
          orderDate: order.createdAt,
        }))];

        // Strong Duplicate + Old Items Clean
        existing.items = existing.items.filter(
          (item: any, index: number, self: any[]) =>
            index === self.findIndex((i: any) =>
              i.name === item.name &&
              Number(i.price) === Number(item.price) &&
              Number(i.quantity) === Number(item.quantity)
            )
        );

        existing.total = orders
          .filter((o) => getGroupKey(o.customerName) === key)
          .reduce((sum, o) => sum + Number(o.total), 0);
      }
      return map;
    }, new Map()).values()
  ).filter((g: any) =>
    g.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (groupKey: string) => {
    setExpandedOrders((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // ================= EDIT =================
  const handleEdit = (group: any) => {
    const customerOrders = orders.filter(
      (o) => getGroupKey(o.customerName) === group.groupKey
    );

    let allItems: Item[] = [];

    customerOrders.forEach((order) => {
      allItems = [
        ...allItems,
        ...order.items.map((item: any) => ({
          name: item.name || '',
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 0,
        })),
      ];
    });

    const uniqueItems = allItems.filter(
      (item, index, self) =>
        index ===
        self.findIndex((i) =>
          i.name === item.name &&
          i.price === item.price &&
          i.quantity === item.quantity
        )
    );

    const totalAmount = uniqueItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const latestOrder = [...customerOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    setEditingOrder(latestOrder);
    setFormData({
      customerName: group.customerName,
      items: uniqueItems,
      total: totalAmount,
    });
    setShowModal(true);
  };

  // ================= ITEM HANDLERS =================
  const handleItemChange = (index: number, field: keyof Item, value: any) => {
    const updated = [...formData.items];
    updated[index] = {
      ...updated[index],
      [field]: field === 'name' ? value : Number(value || 0),
    };

    const newTotal = updated.reduce((sum, item) => sum + item.price * item.quantity, 0);

    setFormData({ ...formData, items: updated, total: newTotal });
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const newTotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    setFormData({ ...formData, items: updatedItems, total: newTotal });
  };

  const handleTotalChange = (value: number) => {
    setFormData((prev) => ({ ...prev, total: value }));
  };

  // ================= UPDATE - BEST SOLUTION =================
const handleUpdate = async () => {
  if (!formData.customerName) {
    alert("Customer name is required!");
    return;
  }

  try {
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: formData.customerName,   // No need to send orderId now
        items: formData.items,
        total: formData.total,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setShowModal(false);
      setEditingOrder(null);
      await fetchOrders();
      alert('✅ Order Updated Successfully');
    } else {
      alert(data.message || 'Update failed');
    }
  } catch (error) {
    console.error(error);
    alert('Update failed');
  }
};

  // ================= DELETE =================
  const handleDeleteOrder = async (group: any) => {
    if (!confirm(`Delete all orders for ${group.customerName}?`)) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: group.customerName }),
      });

      const data = await res.json();
      if (data.success) fetchOrders();
    } catch (error) {
      alert('Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">All Orders</h1>
          <div className="relative w-80">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {groupedOrders.map((group: any) => (
              <div key={group.groupKey} className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div
                  onClick={() => toggleExpand(group.groupKey)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 p-7 text-white flex justify-between items-center cursor-pointer hover:brightness-105"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl">
                      <User size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{group.customerName}</h2>
                      <p className="text-sm opacity-75">
                        {new Date(group.createdAt).toLocaleDateString('en-US', {
                          weekday: 'long', month: 'long', day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-sm opacity-75">Grand Total</p>
                      <p className="text-4xl font-black">Rs. {group.total.toLocaleString()}</p>
                    </div>
                    {expandedOrders[group.groupKey] ? <ChevronUp size={32} /> : <ChevronDown size={32} />}
                  </div>
                </div>

                {expandedOrders[group.groupKey] && (
                  <div className="p-8">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-4 font-medium text-gray-600 w-40">Date</th>
                          <th className="text-left py-4 font-medium text-gray-600">Item</th>
                          <th className="text-right py-4 font-medium text-gray-600">Price</th>
                          <th className="text-center py-4 font-medium text-gray-600">Qty</th>
                          <th className="text-right py-4 font-medium text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item: any, i: number) => (
                          <tr key={i} className="border-b hover:bg-slate-50">
                            <td className="py-5 text-gray-500 text-sm">
                              {new Date(item.orderDate).toLocaleDateString('en-US', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </td>
                            <td className="py-5 font-medium">{item.name}</td>
                            <td className="py-5 text-right">Rs. {item.price}</td>
                            <td className="py-5 text-center">{item.quantity}</td>
                            <td className="py-5 text-right font-bold text-emerald-600">
                              Rs. {item.price * item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex justify-end gap-4 mt-8">
                      <button onClick={() => handleEdit(group)} className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl">
                        <Pencil size={20} /> Edit Order
                      </button>
                      <button onClick={() => handleDeleteOrder(group)} className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl">
                        <Trash2 size={20} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {showModal && editingOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b">
              <h2 className="text-3xl font-bold mb-6">Update Order</h2>
              <input
                className="border border-gray-300 p-4 w-full rounded-2xl text-lg"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>

            <div className="p-8 space-y-4 max-h-[420px] overflow-auto bg-gray-50">
              {formData.items.map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-2xl p-5 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <input className="border border-gray-300 p-3 w-full rounded-xl" value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" className="border border-gray-300 p-3 w-full rounded-xl text-center" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" className="border border-gray-300 p-3 w-full rounded-xl text-center" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                  </div>
                  <div className="col-span-2 text-right font-bold text-lg text-emerald-600">
                    Rs. {item.price * item.quantity}
                  </div>
                  <button onClick={() => handleDeleteItem(index)} className="col-span-1 text-red-500 hover:text-red-700 p-2">
                    <Trash2 size={24} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-b bg-white p-6">
              <div className="flex justify-between items-center bg-gray-50 rounded-2xl p-4">
                <span className="text-2xl font-semibold text-gray-700">Grand Total</span>
                <input
                  type="number"
                  value={formData.total}
                  onChange={(e) => handleTotalChange(Number(e.target.value))}
                  className="text-5xl font-black text-emerald-600 text-right bg-transparent focus:outline-none w-52"
                />
              </div>
            </div>

            <div className="p-8 flex justify-end gap-4 bg-gray-50">
              <button onClick={() => { setShowModal(false); setEditingOrder(null); }} className="px-8 py-3 border border-gray-300 rounded-2xl hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={handleUpdate} className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:brightness-105">
                Update Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}