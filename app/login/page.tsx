"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { useAuthStore } from "@/lib/store";

const VALID_EMAIL = "japangedara01@gmail.com";
const VALID_PASSWORD = "bawanthi@2025";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const isValid =
      email.trim().toLowerCase() === VALID_EMAIL && password === VALID_PASSWORD;

    if (!isValid) {
      setError("Invalid email or password.");
      setIsSubmitting(false);
      return;
    }

    login({
      id: "admin-access",
      email: VALID_EMAIL,
      name: "JP Stock Admin",
      companySettings: {
        name: "JP Stock Management",
        address: "",
        phone: "",
        email: VALID_EMAIL,
        website: "",
      },
    });

    router.replace("/");
  };

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-transparent px-4 py-10 font-sans">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl md:p-10 relative">
        <div className="absolute left-0 top-0 h-1.5 w-full bg-linear-to-r from-[#E8973A] to-[#be7221]" />

        {/* <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8973A]/10 text-[#E8973A]">
              <LockKeyhole className="h-8 w-8" />
            </div>
          </div> */}

        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/Japan-Gedara-Logo-removebg-preview.png"
            alt="JP Stock Management"
            width={110}
            height={110}
            className="mb-4 h-auto w-22"
            priority
          />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Protected Access
          </h1>
          <p className="text-sm text-gray-500">
            Please enter the administrative credentials to access the management
            system.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Email Address
            </label>
            <input
              type="email"
              placeholder="admin@domain.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none transition-all duration-200 shadow-inner placeholder:text-gray-400 focus:border-[#E8973A] focus:bg-white focus:ring-2 focus:ring-[#E8973A]"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none transition-all duration-200 shadow-inner placeholder:text-gray-400 focus:border-[#E8973A] focus:bg-white focus:ring-2 focus:ring-[#E8973A]"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">
              <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E8973A] py-3.5 text-sm font-bold tracking-wide text-gray-900 shadow-md shadow-[#E8973A]/20 transition active:scale-[0.98] hover:bg-[#d4832b] hover:shadow-lg hover:shadow-[#E8973A]/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs font-medium text-gray-500">
          Authorized access only.
        </p>
      </div>
    </main>
  );
}
