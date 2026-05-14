import React from 'react';
import { Search, Plus, Building2, MoreHorizontal, Mail, Phone } from 'lucide-react';

interface CustomersProps {
  customers: any[];
  setActiveTab: (tab: string) => void;
}

export default function Customers({ customers, setActiveTab }: CustomersProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="pl-9 pr-4 py-2 bg-[#0a0a0b] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64 placeholder:text-zinc-600 transition-all"
            />
          </div>
        </div>
        <button onClick={() => setActiveTab('add-customer')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <div key={customer.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{customer.name}</h3>
                  <p className="text-zinc-400 text-sm flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" /> {customer.company}
                  </p>
                </div>
              </div>
              <button className="text-zinc-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Mail className="w-4 h-4 text-zinc-500" /> {customer.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Phone className="w-4 h-4 text-zinc-500" /> {customer.phone}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm text-zinc-400">Total Orders</span>
              <span className="font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full text-sm">
                {customer.totalOrders}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
