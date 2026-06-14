import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, trend }) {
  return (
    <div className="bg-brand-cream border border-brand-sand/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-xs font-bold text-brand-dark/45 uppercase tracking-wider">{label}</p>
          <h3 className="text-2xl font-bold font-space text-brand-ocean">{value}</h3>
        </div>
        <div className="p-3 bg-white border border-brand-sand rounded-xl shadow-sm">
          <Icon className="w-5.5 h-5.5 text-brand-primary" />
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center gap-1.5 mt-4">
          <span className={`inline-flex items-center text-xs font-bold px-1.5 py-0.5 rounded-full ${
            trend.isPositive 
              ? 'bg-emerald-50 text-emerald-700' 
              : 'bg-rose-50 text-rose-700'
          }`}>
            {trend.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />
            )}
            {trend.value}
          </span>
          <span className="text-[10px] text-brand-dark/50 font-medium font-inter">vs last month</span>
        </div>
      )}
    </div>
  );
}
