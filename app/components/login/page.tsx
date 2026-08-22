
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#E7E7E7] px-4">

      {/* VIP Background Glow */}
      <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-purple-700/30 blur-[110px]" />
      <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-amber-500/20 blur-[110px]" />
      <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-blue-700/20 blur-[110px]" />

      {/* Small Login Card */}
      <div className="relative z-10 w-full max-w-sm">

        <div className="rounded-2xl border border-white/10 bg-[#7272a8] p-6 shadow-2xl shadow-purple-950/40 backdrop-blur-2xl">

          {/* Logo */}
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-300 via-blue-500 to-blue-900 shadow-lg shadow-amber-500/30">
              <span className="text-2xl font-black text-black">
                I
              </span>
            </div>

            <h1 className="bg-gradient-to-r from-blue-200 via-blue-400 to-blue-400 bg-clip-text text-3xl font-extrabold text-transparent">
              Iron Steel Store
            </h1>

            <p className="mt-1 text-xs text-gray-400">
              Login to your account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-center text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white">
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                required
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-3 text-sm text-white outline-none placeholder:text-gray-600 transition focus:border-blue-400/70 focus:ring-2 focus:ring-blue-400/20"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white">
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                required
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-3 text-sm text-white outline-none placeholder:text-gray-600 transition focus:border-blue-400/70 focus:ring-2 focus:ring-blue-400/20"
              />
            </div>

          

            {/* Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 via-blue-500 to-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.01] hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] text-gray-500">
              OR
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Register */}
        
        </div>

        <p className="mt-4 text-center text-[10px] tracking-wider text-gray-600">
          © 2026 Iron Steel Store
        </p>
      </div>
    </div>
  );
}

