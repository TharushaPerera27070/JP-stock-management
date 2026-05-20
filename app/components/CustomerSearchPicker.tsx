"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, User, Phone, MapPin, Percent } from "lucide-react";
import { Customer } from "../types";

interface CustomerSearchPickerProps {
  label: string;
  value: string;
  customers: Customer[];
  onChange: (value: string) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export default function CustomerSearchPicker({
  label,
  value,
  customers,
  onChange,
  onSelectCustomer,
}: CustomerSearchPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const filteredCustomers = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) => {
      const name = customer.name?.toLowerCase() || "";
      const contact =
        customer.contactNumber?.toLowerCase() ||
        customer.phone?.toLowerCase() ||
        "";
      const company = customer.company?.toLowerCase() || "";
      const address = customer.address?.toLowerCase() || "";

      return (
        name.includes(query) ||
        contact.includes(query) ||
        company.includes(query) ||
        address.includes(query)
      );
    });
  }, [customers, value]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (customer: Customer) => {
    onChange(customer.name);
    onSelectCustomer(customer);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Type a customer name"
          className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-sm font-medium transition-all text-gray-900 placeholder:text-gray-400"
          autoComplete="off"
        />

        {isOpen && filteredCustomers.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="max-h-80 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelect(customer)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* <div className="w-9 h-9 rounded-full bg-[#E8973A]/10 text-[#E8973A] flex items-center justify-center shrink-0">
                        <User className="w-4.5 h-4.5" />
                      </div> */}
                      <div className="min-w-0 space-y-1">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {customer.name}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.contactNumber || customer.phone || "—"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {customer.address || "—"}
                          </span>
                        </div>
                        {customer.company && (
                          <div className="text-xs text-gray-500 truncate">
                            Company: {customer.company}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="inline-flex items-center gap-1 rounded-full bg-[#E8973A]/10 px-2.5 py-1 text-xs font-semibold text-[#E8973A]">
                        {customer.discount || 0}%
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
