import React from 'react';
import { ArrowLeft, Save, User, Building2, Mail, Phone, MapPin } from 'lucide-react';

interface AddCustomerProps {
  onBack: () => void;
}

export default function AddCustomer({ onBack }: AddCustomerProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-end">
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-gray-900 font-medium transition-all shadow-lg shadow-[#E8973A]/20">
          <Save className="w-4 h-4" /> Save Customer
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b border-gray-200 pb-2">Contact Details</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <User className="w-4 h-4" />
                </span>
                <input type="text" placeholder="e.g. Nimal Perera" className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input type="email" placeholder="nimal@example.com" className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Phone Number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Phone className="w-4 h-4" />
                </span>
                <input type="tel" placeholder="+94 77 123 4567" className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b border-gray-200 pb-2">Company Information</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Company Name</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Building2 className="w-4 h-4" />
                </span>
                <input type="text" placeholder="e.g. BuildTech Constructions" className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Billing Address</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-gray-500">
                  <MapPin className="w-4 h-4" />
                </span>
                <textarea rows={4} placeholder="Full address..." className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all resize-none"></textarea>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
