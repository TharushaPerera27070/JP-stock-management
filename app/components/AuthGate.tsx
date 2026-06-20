"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  // Firebase Auth ready state — null means "not checked yet"
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    // Wait for Firebase Auth to restore session
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // Firebase says no session — clear Zustand too
        logout();
      }
      // Firebase has resolved either way — safe to proceed
      setFirebaseReady(true);
    });
    return () => unsub();
  }, [logout]);

  useEffect(() => {
    if (!hasHydrated || !firebaseReady) return;

    if (!isAuthenticated && pathname !== "/login") {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && pathname === "/login") {
      router.replace("/");
    }
  }, [hasHydrated, firebaseReady, isAuthenticated, pathname, router]);

  // Show loader until BOTH Zustand AND Firebase Auth are ready
  if (!hasHydrated || !firebaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white/90 px-8 py-6 shadow-2xl backdrop-blur-md">
          <Loader2 className="w-6 h-6 animate-spin text-[#E8973A]" />
          <p className="text-sm font-medium text-gray-500">
            Loading access state...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && pathname !== "/login") {
    return null;
  }

  if (isAuthenticated && pathname === "/login") {
    return null;
  }

  return <>{children}</>;
}
