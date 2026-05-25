"use client";

import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
// TODO: Import your new database authentication logic here
// import { signIn } from "@/app/lib/new_database_auth";

interface AdminAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionType: "edit" | "delete" | "";
}

export default function AdminAuthDialog({
  isOpen,
  onClose,
  onSuccess,
  actionType = "",
}: AdminAuthDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement your new database authentication logic here
      // Example: await signIn(email, password);

      // Simulating a successful login for now
      console.log("Authenticating with new DB...");

      setEmail("");
      setPassword("");
      onSuccess();
    } catch (err: any) {
      console.error("Authentication error:", err);
      // TODO: Handle your new database's specific error codes here
      setError("Failed to authenticate. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleOverlayClick}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-[#E8973A]" />

        {/* Close button */}
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6 md:p-8">
          {/* Header Icon & Text */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-[#E8973A] mb-4 border border-amber-100">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Admin Authorization Required
            </h3>
            <p className="mt-1.5 text-sm text-gray-500 max-w-xs leading-relaxed">
              Please enter your admin credentials to{" "}
              {actionType || "perform this action"}.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 ml-1">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-md disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>Verify & Continue</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
