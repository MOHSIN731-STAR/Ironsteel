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

  // ================= FETCH =================
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getGroupKey = (name: string) => name.toLowerCase().trim();

  // ================= GROUP ORDERS =================
  const groupedOrders = Array.from(
    orders.reduce((map, order) => {
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

  const toggleExpand = (key: string) => {
    setExpandedOrders((p) => ({ ...p, [key]: !p[key] }));
  };

  // ================= PRINT (QZ TRAY) =================
const handleEdit = (group: any) => {
  setEditingOrder(group);
  setFormData({
    customerName: group.customerName,
    items: group.items,
    total: group.total,
  });
  setShowModal(true);
};

const handleDelete = async (id: number) => {
  const confirmDelete = confirm('Are you sure?');

  if (!confirmDelete) return;

  try {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'DELETE',
    });

    const data = await res.json();

    if (data.success) {
      fetchOrders();
      alert('Order deleted');
    }
  } catch (error) {
    console.error(error);
    alert('Delete failed');
  }
};

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between mb-6">
          <h1 className="text-3xl font-bold">All Orders</h1>

          <div className="relative w-80">
            <Search className="absolute left-3 top-3 text-gray-400" />
            <input
              className="w-full pl-10 py-2 border rounded-xl"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-6">

            {groupedOrders.map((group: any) => (
              <div key={group.groupKey} className="bg-white rounded-xl shadow">

                {/* HEADER */}
                <div
                  onClick={() => toggleExpand(group.groupKey)}
                  className="p-6 bg-indigo-600 text-white flex justify-between cursor-pointer"
                >
                  <div className="flex gap-3 items-center">
                    <User />
                    <h2 className="text-xl">{group.customerName}</h2>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p>Total</p>
                      <p className="font-bold">Rs {group.total}</p>
                    </div>
                    {expandedOrders[group.groupKey] ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>

                {/* BODY */}
                {expandedOrders[group.groupKey] && (
                  <div className="p-6">

                    {group.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between border-b py-2">
                        <span>{item.name}</span>
                        <span>{item.quantity} x {item.price}</span>
                        <span className="font-bold">
                          Rs {item.price * item.quantity}
                        </span>
                      </div>
                    ))}

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-4 mt-6">

  <button
    onClick={(e) => {
      e.stopPropagation();
      handleEdit(group);
    }}
    className="bg-indigo-600 text-white px-5 py-2 rounded-lg flex gap-2"
  >
    <Pencil size={18} />
    Edit
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation();
      handleDelete(group.id);
    }}
    className="bg-red-600 text-white px-5 py-2 rounded-lg flex gap-2"
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
    </div>
  );
}