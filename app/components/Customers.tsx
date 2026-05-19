import React from 'react';
import { Search, Plus, Building2, MoreHorizontal, Mail, Phone } from 'lucide-react';

import { Customer } from '../types';

interface CustomersProps {
  customers: Customer[];
  setActiveTab: (tab: string) => void;
}

export default function Customers({ customers, setActiveTab }: CustomersProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 w-full sm:w-64 placeholder:text-gray-600 transition-all"
            />
          </div>
        </div>
        <button onClick={() => setActiveTab('add-customer')} className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-gray-900 text-sm font-medium transition-all shadow-lg shadow-[#E8973A]/20">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <div key={customer.id} className="p-6 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm hover:bg-white transition-colors group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#E8973A] flex items-center justify-center text-gray-900 font-bold text-lg shadow-lg">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{customer.name}</h3>
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" /> {customer.company}
                  </p>
                </div>
              </div>
              <button className="text-gray-500 hover:text-gray-900 transition-colors opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-500" /> {customer.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-500" /> {customer.phone}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total Orders</span>
              <span className="font-bold text-[#E8973A] bg-[#E8973A]/10 px-3 py-1 rounded-full text-sm">
                {customer.totalOrders}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
