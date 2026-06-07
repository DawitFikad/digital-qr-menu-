"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      localStorage.setItem("admin_auth", "true");
      router.push("/admin/dashboard");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="luxury-bg flex items-center justify-center p-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white rounded-3xl p-8 card-accent"
      >
        <div className="w-14 h-14 bg-gold rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield size={28} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-coffee text-center mb-2">
          Admin Login
        </h1>
        <p className="text-sm text-coffee-muted/70 text-center mb-6">
          Sign in to manage your menu
        </p>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl mb-4">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-coffee-muted/70 mb-1.5 block">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-coffee-muted/70 mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-cream-dark rounded-xl text-sm text-coffee focus:outline-none focus:ring-2 focus:ring-gold/50 pr-10"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-coffee-muted/50"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gold text-white rounded-xl font-semibold text-sm hover:bg-coffee-muted transition-colors"
          >
            Sign In
          </button>
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-full text-center text-xs text-coffee-muted/50 mt-4 hover:text-gold transition-colors"
        >
          Back to Menu
        </button>
      </form>
    </div>
  );
}
