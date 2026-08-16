'use client';

import { useEffect, useState } from 'react';
import { Trash2, Pencil, X } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
}

export default function CustomerPage() {
  const [name, setName] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  // EDIT MODE
  const [editingId, setEditingId] = useState<number | null>(null);

  // ================= GET CUSTOMERS =================
  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ================= ADD / UPDATE CUSTOMER =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter customer name');
      return;
    }

    try {
      setLoading(true);

      // ================= UPDATE =================
      if (editingId !== null) {
        const response = await fetch('/api/customers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingId,
            name: name.trim(),
          }),
        });

        const data = await response.json();

        if (data.success) {
          setName('');
          setEditingId(null);
          await fetchCustomers();

          alert('Customer updated successfully');
        } else {
          alert(data.message);
        }

        return;
      }

      // ================= ADD =================
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setName('');
        await fetchCustomers();

        alert('Customer added successfully');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ================= EDIT CUSTOMER =================
  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setName(customer.name);

    // Input par focus ke liye thora scroll
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // ================= CANCEL EDIT =================
  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
  };

  // ================= DELETE CUSTOMER =================
  const handleDelete = async (id: number) => {
    const confirmDelete = confirm(
      'Are you sure you want to delete this customer?'
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const res = await fetch(`/api/customers?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        alert('Deleted');

        // Agar deleted customer edit mode mein tha
        if (editingId === id) {
          setEditingId(null);
          setName('');
        }

        fetchCustomers();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
      alert('Delete failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-5">

      {/* ================= FORM ================= */}
      <div className="bg-white shadow-lg rounded-lg p-6">

        <h1 className="text-2xl font-bold mb-5 text-center">
          Customer Management
        </h1>

        <form onSubmit={handleSubmit} className="flex gap-3">

          <input
            type="text"
            placeholder="Enter customer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border p-3 rounded outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* ADD / UPDATE BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`text-white px-6 rounded ${
              editingId !== null
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading
              ? editingId !== null
                ? 'Updating...'
                : 'Saving...'
              : editingId !== null
              ? 'Update'
              : 'Add'}
          </button>

          {/* CANCEL BUTTON */}
          {editingId !== null && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 rounded flex items-center gap-1"
            >
              <X size={18} />
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* ================= CUSTOMER LIST ================= */}
      <div className="mt-8 bg-white shadow-lg rounded-lg p-6">

        <h2 className="text-xl font-bold mb-4">
          Customers List
        </h2>

        {customers.length === 0 ? (
          <p>No customers found</p>
        ) : (
          <div className="space-y-3">

            {customers.map((customer) => (
              <div
                key={customer.id}
                className={`flex justify-between items-center border p-3 rounded ${
                  editingId === customer.id
                    ? 'border-blue-500 bg-blue-50'
                    : ''
                }`}
              >

                {/* CUSTOMER NAME */}
                <div>
                  <p className="font-medium">
                    {customer.name}
                  </p>

                  {editingId === customer.id && (
                    <p className="text-xs text-blue-600 mt-1">
                      Editing...
                    </p>
                  )}
                </div>

                {/* BUTTONS */}
                <div className="flex gap-2">

                  {/* UPDATE / EDIT BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleEdit(customer)}
                    disabled={editingId === customer.id}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white p-2 rounded"
                    title="Edit Customer"
                  >
                    <Pencil size={18} />
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleDelete(customer.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded"
                    title="Delete Customer"
                  >
                    <Trash2 size={18} />
                  </button>

                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </div>
  );
}