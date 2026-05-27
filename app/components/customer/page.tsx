'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
}

export default function CustomerPage() {
  const [name, setName] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

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

  // ================= ADD CUSTOMER =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      alert('Please enter customer name');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (data.success) {
        setName('');
        fetchCustomers();
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

  // ================= DELETE CUSTOMER =================
const handleDelete = async (id: number) => {
  try {
    const res = await fetch(`/api/customers?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      alert("Deleted");
      fetchCustomers();
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.log(error);
    alert("Delete failed");
  }
};

  return (
    <div className="max-w-2xl mx-auto mt-10 p-5">
      {/* FORM */}
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
            className="flex-1 border p-3 rounded outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 rounded"
          >
            {loading ? 'Saving...' : 'Add'}
          </button>
        </form>
      </div>

      {/* CUSTOMER LIST */}
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
                className="flex justify-between items-center border p-3 rounded"
              >
                <p className="font-medium">{customer.name}</p>

                <button
                  onClick={() => handleDelete(customer.id)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}