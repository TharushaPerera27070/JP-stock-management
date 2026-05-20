"use client";

import { useState, type FormEvent } from "react";
import {
  Save,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Percent,
} from "lucide-react";
import { upsertCustomerToFirestore } from "@/lib/firestoreService";
import { Customer } from "../types";

interface AddCustomerProps {
  onBack: () => void;
  onSaved?: (customer: Customer) => void;
}

export default function AddCustomer({ onBack, onSaved }: AddCustomerProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const savedId = await upsertCustomerToFirestore({
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        contactNumber: contactNumber.trim(),
        phone: contactNumber.trim(),
        address: address.trim(),
        discount: Number(discount) || 0,
        totalOrders: 0,
      });

      onSaved?.({
        id: savedId,
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        contactNumber: contactNumber.trim(),
        phone: contactNumber.trim(),
        address: address.trim(),
        discount: Number(discount) || 0,
        totalOrders: 0,
      });

      setName("");
      setCompany("");
      setEmail("");
      setContactNumber("");
      setAddress("");
      setDiscount(0);
      onBack();
    } catch (error) {
      console.error("Customer save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add Customer</h2>
          <p className="text-sm text-gray-500">
            Saved records will be available in the Customers section and in
            invoice / quotation search.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] disabled:opacity-60 text-gray-900 font-medium transition-all shadow-lg shadow-[#E8973A]/20"
        >
          <Save className="w-4 h-4" />{" "}
          {isSaving ? "Saving..." : "Save Customer"}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b border-gray-200 pb-2">
              Contact Details
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Full Name *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nimal Perera"
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Contact Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nimal@example.com"
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b border-gray-200 pb-2">
              Company Information
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Company Name
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Building2 className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. BuildTech Constructions"
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Billing Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-gray-500">
                  <MapPin className="w-4 h-4" />
                </span>
                <textarea
                  rows={4}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address..."
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all resize-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Customer Discount (%)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Percent className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
