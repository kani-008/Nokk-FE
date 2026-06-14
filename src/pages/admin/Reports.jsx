import React, { useState } from 'react';
import { Calendar, Download, BarChart3, LineChart, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';

export default function Reports() {
  const addToast = useToastStore(state => state.addToast);

  const [dateRange, setDateRange] = useState({ start: '2026-06-01', end: '2026-06-14' });
  const [activeTab, setActiveTab] = useState('sales'); // sales | revenue | products | customers

  const handleExport = (type) => {
    addToast(`Exporting ${activeTab} report for range ${dateRange.start} to ${dateRange.end} as ${type.toUpperCase()}...`, 'success');
  };

  // SVG Chart Dimensions
  const chartWidth = 500;
  const chartHeight = 200;
  const padding = 40;

  // Custom sales data
  const monthlySales = [
    { label: 'Jan', value: 120 },
    { label: 'Feb', value: 165 },
    { label: 'Mar', value: 140 },
    { label: 'Apr', value: 210 },
    { label: 'May', value: 245 },
    { label: 'Jun', value: 310 }
  ];

  const maxSales = Math.max(...monthlySales.map(m => m.value)) || 1;
  const salesPoints = monthlySales.map((m, index) => {
    const x = padding + (index * (chartWidth - padding * 2)) / (monthlySales.length - 1);
    const y = chartHeight - padding - (m.value / maxSales) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // Category sales split donut chart data
  const categorySplit = [
    { name: 'Dry Fish', value: 45, color: '#8B2500' },
    { name: 'Pickles', value: 25, color: '#D4621A' },
    { name: 'Prawns', value: 15, color: '#1A4A5C' },
    { name: 'Masalas', value: 10, color: '#2E7D32' },
    { name: 'Combos', value: 5, color: '#E5A93B' }
  ];

  // Top Customers mock database list
  const topCustomers = [
    { name: 'Anbarasan M', email: 'customer@gmail.com', orders: 15, spend: 6450 },
    { name: 'Deepak Kumar', email: 'deepak@gmail.com', orders: 9, spend: 3820 },
    { name: 'Selvanathan P', email: 'selva@gmail.com', orders: 6, spend: 2900 },
    { name: 'Karthik Raja', email: 'karthik@gmail.com', orders: 4, spend: 1850 }
  ];

  return (
    <div className="space-y-6 font-inter pb-10">
      {/* Header & Export controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-brand-sand pb-4 gap-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-brand-ocean">Sales Reports</h1>
          <p className="text-xs text-brand-dark/50 font-medium mt-1">Extract financial insights, monitor top selling items, and print invoices</p>
        </div>

        {/* Date pickers & exports */}
        <div className="flex flex-wrap items-center gap-2.5 font-space text-[10px] font-bold">
          <div className="flex items-center border border-brand-sand bg-white rounded-xl px-2 py-1.5 gap-1.5 shadow-sm text-brand-ocean select-none">
            <Calendar className="w-3.5 h-3.5 text-brand-primary" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="focus:outline-none"
            />
            <span className="text-brand-dark/40">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleExport('csv')}
            className="border border-brand-sand hover:border-brand-ocean bg-white text-brand-ocean px-3.5 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="bg-brand-primary text-brand-cream px-3.5 py-2 rounded-xl hover:bg-brand-secondary active:scale-95 transition-all flex items-center gap-1 cursor-pointer shadow shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-brand-sand gap-6 overflow-x-auto no-scrollbar pb-0.5">
        {[
          { id: 'sales', label: 'Sales Trends', icon: LineChart },
          { id: 'revenue', label: 'Revenue Split', icon: PieChart },
          { id: 'products', label: 'Top Products', icon: BarChart3 },
          { id: 'customers', label: 'Top Customers', icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 pb-3 font-bold text-xs md:text-sm border-b-2 shrink-0 transition-colors cursor-pointer ${
                activeTab === tab.id ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-dark/50 hover:text-brand-ocean'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="bg-white border border-brand-sand rounded-3xl p-6 md:p-8 shadow-sm">
        
        {/* TAB 1: Sales Trends (SVG Line Chart) */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-playfair text-sm font-bold text-brand-ocean">Monthly Sales Volume</h3>
                <p className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider">Quantity units sold</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +22.4% MoM
              </span>
            </div>

            <div className="relative max-w-2xl mx-auto pt-4">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#FFF8EE" strokeDasharray="3" />
                <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#FFF8EE" strokeDasharray="3" />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#F5EDD6" strokeWidth="1.5" />

                {/* Line grid path */}
                <polyline
                  fill="none"
                  stroke="#8B2500"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  points={salesPoints}
                />

                {/* Dots */}
                {monthlySales.map((m, index) => {
                  const x = padding + (index * (chartWidth - padding * 2)) / (monthlySales.length - 1);
                  const y = chartHeight - padding - (m.value / maxSales) * (chartHeight - padding * 2);
                  return (
                    <circle key={index} cx={x} cy={y} r="5" className="fill-brand-secondary stroke-white stroke-2" />
                  );
                })}

                {/* X labels */}
                {monthlySales.map((m, index) => {
                  const x = padding + (index * (chartWidth - padding * 2)) / (monthlySales.length - 1);
                  return (
                    <text key={index} x={x} y={chartHeight - 12} textAnchor="middle" className="font-space text-[10px] font-bold fill-brand-dark/50">
                      {m.label}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* TAB 2: Revenue Split (SVG Donut Chart) */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-playfair text-sm font-bold text-brand-ocean">Category split split</h3>
              <p className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider">Gross revenue distribution</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-xl mx-auto py-2">
              {/* SVG Donut */}
              <div className="flex justify-center">
                <svg viewBox="0 0 100 100" className="w-36 h-36">
                  {/* Donut slice simulations using stroke-dasharray */}
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#E5A93B" strokeWidth="16" strokeDasharray="220 220" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#2E7D32" strokeWidth="16" strokeDasharray="210 220" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#1A4A5C" strokeWidth="16" strokeDasharray="180 220" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#D4621A" strokeWidth="16" strokeDasharray="150 220" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#8B2500" strokeWidth="16" strokeDasharray="98 220" />
                  {/* Center cutout */}
                  <circle cx="50" cy="50" r="26" fill="white" />
                  <text x="50" y="54" textAnchor="middle" className="font-space text-[10px] font-bold fill-brand-ocean">100%</text>
                </svg>
              </div>

              {/* Legends */}
              <div className="space-y-2.5 font-bold text-xs text-brand-dark/80 font-space">
                {categorySplit.map((c, i) => (
                  <div key={i} className="flex justify-between items-center p-1 px-3 bg-brand-cream/45 border border-brand-sand/50 rounded-lg">
                    <span className="flex items-center gap-2 font-inter font-medium text-brand-dark">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </span>
                    <span>{c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Top Products (Horizontal Bars) */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-playfair text-sm font-bold text-brand-ocean">Top 5 Bestselling Sourced Items</h3>
              <p className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider">Sales count index</p>
            </div>

            <div className="space-y-4 max-w-xl mx-auto font-space text-xs font-semibold">
              {[
                { name: 'Nethili Karuvadu (Anchovy)', value: 85, color: '#8B2500' },
                { name: 'Prawn Pickle (Spicy)', value: 64, color: '#D4621A' },
                { name: 'Sura Karuvadu (Shark)', value: 50, color: '#1A4A5C' },
                { name: 'Dry Prawns (Ular Eral)', value: 38, color: '#2E7D32' },
                { name: 'Village Combo pack', value: 25, color: '#E5A93B' }
              ].map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-brand-dark">
                    <span className="font-inter font-medium text-brand-dark/85">{item.name}</span>
                    <span>{item.value} units</span>
                  </div>
                  <div className="h-3 w-full bg-brand-cream border border-brand-sand/65 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        backgroundColor: item.color,
                        width: `${(item.value / 100) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Top Customers */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-playfair text-sm font-bold text-brand-ocean">Valued Customer spenders</h3>
              <p className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider">Top accounts by lifetime value</p>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse border border-brand-sand rounded-2xl overflow-hidden">
                <thead>
                  <tr className="bg-brand-cream border-b border-brand-sand text-brand-ocean font-bold">
                    <th className="px-6 py-3.5">Rank</th>
                    <th className="px-6 py-3.5">Customer details</th>
                    <th className="px-6 py-3.5 text-center">Orders Placed</th>
                    <th className="px-6 py-3.5 text-right">Lifetime Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-sand font-semibold text-brand-dark/80">
                  {topCustomers.map((cust, idx) => (
                    <tr key={idx} className="hover:bg-brand-sand/5">
                      <td className="px-6 py-3 font-space text-brand-primary"># {idx + 1}</td>
                      <td className="px-6 py-3">
                        <p className="font-bold text-brand-dark">{cust.name}</p>
                        <p className="text-[10px] text-brand-dark/50">{cust.email}</p>
                      </td>
                      <td className="px-6 py-3 text-center font-space text-brand-ocean font-bold">{cust.orders} orders</td>
                      <td className="px-6 py-3 text-right font-space text-brand-primary font-bold">₹{cust.spend.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
