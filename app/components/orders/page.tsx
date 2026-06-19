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

const removeItem = (index: number) => {
  const updatedItems = formData.items.filter((_, i) => i !== index);

  const total = updatedItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  setFormData({
    ...formData,
    items: updatedItems,
    total,
  });
};

const updateItem = (
  index: number,
  field: keyof Item,
  value: string | number
) => {
  const updatedItems = [...formData.items];

  updatedItems[index] = {
    ...updatedItems[index],
    [field]: value,
  };

  const total = updatedItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  setFormData({
    ...formData,
    items: updatedItems,
    total,
  });
};

const handleUpdateOrder = async () => {
  try {
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: editingOrder?.id,
        customerName: formData.customerName,
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

const handleDelete = async (customerName: string) => {
  if (!confirm('Are you sure?')) return;

  try {
    const res = await fetch('/api/orders', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerName }),
    });

    const data = await res.json();

    if (data.success) {
      fetchOrders();
      alert('Orders deleted successfully');
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error(error);
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

                  {/* TABLE HEADER */}
<div className="grid grid-cols-5 gap-4 border-b font-bold pb-2 mb-2">
  <div>Date</div>
  <div>Item</div>
  <div>Qty/KG</div>
  <div>Price</div>
  <div>Total Price</div>
</div>

{/* TABLE ROWS */}
{group.items.map((item: any, i: number) => (
  <div
    key={i}
    className="grid grid-cols-5 gap-4 border-b py-2 items-center"
  >
    <div>
      {new Date(item.orderDate).toLocaleDateString()}
    </div>

    <div>{item.name}</div>

    <div>{item.quantity}</div>

    <div>Rs {item.price}</div>

    <div className="font-bold">
      Rs {item.price * item.quantity}
    </div>
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
      handleDelete(group.customerName);
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
          value={formData.customerName}
          onChange={(e) =>
            setFormData({
              ...formData,
              customerName: e.target.value,
            })
          }
          className="w-full border rounded-lg p-3 mt-2 mb-6"
        />

        <div className="space-y-4">

          {formData.items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-3 items-center border rounded-lg p-3"
            >
              <input
                value={item.name}
                onChange={(e) =>
                  updateItem(index, 'name', e.target.value)
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
                    Number(e.target.value)
                  )
                }
                placeholder="Price"
                className="col-span-2 border rounded-lg p-2"
              />

              <input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(
                    index,
                    'quantity',
                    Number(e.target.value)
                  )
                }
                placeholder="Qty"
                className="col-span-2 border rounded-lg p-2"
              />

              <div className="col-span-2 font-bold text-center">
                Rs {item.price * item.quantity}
              </div>

              <button
                onClick={() => removeItem(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}

        </div>

        <button
          onClick={addItem}
          className="mt-5 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} />
          Add Item
        </button>

        <div className="mt-8 text-right">
          <h3 className="text-2xl font-bold">
            Total: Rs {formData.total}
          </h3>
        </div>

      </div>

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
          onClick={handleUpdateOrder}
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