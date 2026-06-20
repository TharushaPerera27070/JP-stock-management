"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DialogProvider } from "./components/Dialog";
import CloudSettingsInitializer from "./components/CloudSettingsInitializer";
import AuthGate from "./components/AuthGate";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/lib/store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Separate client component to handle Firebase Auth sync
function FirebaseAuthSync() {
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // Firebase says no active session — clear Zustand store too
        logout();
      }
    });
    return () => unsub();
  }, [logout]);

  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DialogProvider>
          <FirebaseAuthSync />
          <AuthGate>
            <CloudSettingsInitializer />
            {children}
          </AuthGate>
        </DialogProvider>
      </body>
    </html>
  );
}
