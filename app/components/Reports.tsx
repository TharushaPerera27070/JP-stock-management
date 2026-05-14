import React from 'react';
import { BarChart3, Download } from 'lucide-react';

export default function Reports() {
  return (
    <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
        <BarChart3 className="w-10 h-10 text-indigo-400" />
      </div>
      <h2 className="text-3xl font-bold mb-4">Advanced Analytics Coming Soon</h2>
      <p className="text-zinc-400 max-w-md text-lg mb-8">
        We are building comprehensive sales reports, stock predictions, and profit margin analysis for your sandwich panels.
      </p>
      <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all">
        <Download className="w-4 h-4" /> Download Basic CSV Report
      </button>
    </div>
  );
}
