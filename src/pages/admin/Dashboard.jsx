import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Users, ClipboardList, IndianRupee, 
  AlertTriangle, TrendingUp, RefreshCcw, Eye, ArrowRight 
} from 'lucide-react';
import { api } from '../../services/api';
import StatCard from '../../components/StatCard';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import Modal from '../../components/Modal';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);

  const [timeframe, setTimeframe] = useState('monthly'); // daily | weekly | monthly
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [p, u, o, s] = await Promise.all([
        api.getProducts(),
        api.getUsers(),
        api.getOrders(),
        api.getSettings()
      ]);
      setProducts(p);
      setUsers(u);
      setOrders(o);
      setSettings(s);
    } catch (err) {
      console.error("Error loading Dashboard metrics:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // calculations
  const totalRevenue = useMemo(() => {
    return orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((acc, o) => acc + o.total, 0);
  }, [orders]);

  const recentOrders = useMemo(() => {
    return orders.slice(0, 5);
  }, [orders]);

  // Low stock products checklist
  const lowStockProducts = useMemo(() => {
    const list = [];
    products.forEach(p => {
      p.variants.forEach(v => {
        if (v.stock < 10) {
          list.push({
            id: `${p.id}-${v.weight}`,
            nameEn: p.nameEn,
            nameTa: p.nameTa,
            weight: v.weight,
            stock: v.stock,
            image: p.image
          });
        }
      });
    });
    return list.slice(0, 5);
  }, [products]);

  // Dynamic values for charts (Daily, Weekly, Monthly SVG data)
  const salesData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    if (timeframe === 'daily') {
      const result = days.map(d => ({ label: d, value: 0 }));
      orders.forEach(o => {
        if (o.status !== 'Cancelled') {
          const dayIdx = (new Date(o.date).getDay() + 6) % 7; // shift to Mon-Sun
          if (result[dayIdx]) {
            result[dayIdx].value += o.total;
          }
        }
      });
      // if all are 0, fallback to default mockup values
      if (result.every(r => r.value === 0)) {
        return [
          { label: 'Mon', value: 1200 },
          { label: 'Tue', value: 2400 },
          { label: 'Wed', value: 1800 },
          { label: 'Thu', value: 3200 },
          { label: 'Fri', value: 2900 },
          { label: 'Sat', value: 4800 },
          { label: 'Sun', value: 5200 }
        ];
      }
      return result;
    }

    if (timeframe === 'weekly') {
      const result = [
        { label: 'Week 1', value: 0 },
        { label: 'Week 2', value: 0 },
        { label: 'Week 3', value: 0 },
        { label: 'Week 4', value: 0 }
      ];
      orders.forEach(o => {
        if (o.status !== 'Cancelled') {
          const date = new Date(o.date).getDate();
          const weekIdx = Math.min(3, Math.floor((date - 1) / 7));
          result[weekIdx].value += o.total;
        }
      });
      if (result.every(r => r.value === 0)) {
        return [
          { label: 'Week 1', value: 12000 },
          { label: 'Week 2', value: 15400 },
          { label: 'Week 3', value: 18900 },
          { label: 'Week 4', value: 24300 }
        ];
      }
      return result;
    }

    // Monthly default
    const result = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      result.push({ label: months[d.getMonth()], value: 0, year: d.getFullYear(), monthIdx: d.getMonth() });
    }
    orders.forEach(o => {
      if (o.status !== 'Cancelled') {
        const date = new Date(o.date);
        const bucket = result.find(r => r.monthIdx === date.getMonth() && r.year === date.getFullYear());
        if (bucket) {
          bucket.value += o.total;
        }
      }
    });
    if (result.every(r => r.value === 0)) {
      return [
        { label: 'Jan', value: 45000 },
        { label: 'Feb', value: 52000 },
        { label: 'Mar', value: 49000 },
        { label: 'Apr', value: 68000 },
        { label: 'May', value: 82000 },
        { label: 'Jun', value: 95000 }
      ];
    }
    return result.map(({ label, value }) => ({ label, value }));
  }, [orders, timeframe]);

  // Top Products bar charts computed dynamically from orders
  const topProducts = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      if (o.status !== 'Cancelled') {
        o.items.forEach(item => {
          counts[item.nameEn] = (counts[item.nameEn] || 0) + item.quantity;
        });
      }
    });
    const colors = ['#8B2500', '#D4621A', '#1A4A5C', '#2E7D32', '#E5A93B'];
    const sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
      
    if (sorted.length === 0) {
      return [
        { name: 'Nethili Karuvadu', value: 45, color: '#8B2500' },
        { name: 'Prawn Pickle', value: 32, color: '#D4621A' },
        { name: 'Sura Karuvadu', value: 28, color: '#1A4A5C' },
        { name: 'Dry Prawns', value: 18, color: '#2E7D32' },
        { name: 'Karuvadu Thokku', value: 15, color: '#E5A93B' }
      ];
    }
    return sorted.map((item, idx) => ({ ...item, color: colors[idx % colors.length] }));
  }, [orders]);

  // SVG Chart Computations
  const chartWidth = 500;
  const chartHeight = 180;
  const padding = 35;

  const points = useMemo(() => {
    if (salesData.length === 0) return '';
    const maxVal = Math.max(...salesData.map(d => d.value)) || 1;
    
    return salesData.map((d, index) => {
      const x = padding + (index * (chartWidth - padding * 2)) / (salesData.length - 1);
      const y = chartHeight - padding - (d.value / maxVal) * (chartHeight - padding * 2);
      return `${x},${y}`;
    }).join(' ');
  }, [salesData]);

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-10 font-inter">
      {/* Header controls */}
      <div className="flex justify-between items-center border-b border-brand-sand pb-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-brand-ocean">Dashboard Overview</h1>
          <p className="text-xs text-brand-dark/50 font-medium mt-1">Real-time indicators & statistics for NammaOorKaruvattuKadai</p>
        </div>
        <button
          onClick={loadData}
          className="p-2 border border-brand-sand hover:border-brand-ocean bg-white text-brand-ocean rounded-xl transition-all active:scale-95 flex items-center gap-1.5 font-semibold text-xs shadow-sm cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4 text-brand-primary" /> Reload Data
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={ShoppingBag}
          label="Total Products Catalog"
          value={products.length}
          trend={{ value: '4.8%', isPositive: true }}
        />
        <StatCard
          icon={Users}
          label="Registered Users"
          value={users.length}
          trend={{ value: '12%', isPositive: true }}
        />
        <StatCard
          icon={ClipboardList}
          label="Total Orders Logged"
          value={orders.length}
          trend={{ value: '18.4%', isPositive: true }}
        />
        <StatCard
          icon={IndianRupee}
          label="Gross revenue"
          value={`₹${totalRevenue.toFixed(2)}`}
          trend={{ value: '15.2%', isPositive: true }}
        />
      </div>

      {/* Grid: Charts Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sales metric SVG line chart (col-span-7) */}
        <div className="lg:col-span-7 bg-white border border-brand-sand p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-brand-sand pb-3">
            <div>
              <h3 className="font-playfair text-sm font-bold text-brand-ocean">Revenue Analytics</h3>
              <p className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider mt-0.5">Sales over time</p>
            </div>
            
            {/* Daily/Weekly/Monthly Toggle */}
            <div className="flex bg-brand-cream border border-brand-sand rounded-xl p-1 font-space text-[10px] font-bold">
              {['daily', 'weekly', 'monthly'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 rounded-lg transition-all capitalize cursor-pointer ${
                    timeframe === t 
                      ? 'bg-brand-ocean text-brand-cream' 
                      : 'text-brand-dark/75 hover:bg-brand-ocean/5'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Line representation */}
          <div className="relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#F5EDD6" strokeDasharray="4" />
              <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#F5EDD6" strokeDasharray="4" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#E5E4E7" strokeWidth="1.5" />

              {/* Line path */}
              <polyline
                fill="none"
                stroke="#8B2500"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />

              {/* Scatter Points overlay */}
              {salesData.map((d, index) => {
                const maxVal = Math.max(...salesData.map(sd => sd.value)) || 1;
                const x = padding + (index * (chartWidth - padding * 2)) / (salesData.length - 1);
                const y = chartHeight - padding - (d.value / maxVal) * (chartHeight - padding * 2);
                
                return (
                  <g key={index} className="group/dot cursor-pointer">
                    <circle cx={x} cy={y} r="5" className="fill-brand-secondary stroke-white stroke-2" />
                    <circle cx={x} cy={y} r="10" className="fill-brand-secondary/15 opacity-0 hover:opacity-100 transition-opacity" />
                  </g>
                );
              })}

              {/* Labels */}
              {salesData.map((d, index) => {
                const x = padding + (index * (chartWidth - padding * 2)) / (salesData.length - 1);
                return (
                  <text
                    key={index}
                    x={x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    className="font-space text-[10px] font-bold fill-brand-dark/50"
                  >
                    {d.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Top 5 Products Bar Chart (col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-brand-sand p-6 rounded-3xl shadow-sm space-y-4">
          <div className="border-b border-brand-sand pb-3">
            <h3 className="font-playfair text-sm font-bold text-brand-ocean">Best Selling Fish</h3>
            <p className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider mt-0.5">Quantity sold index</p>
          </div>

          <div className="space-y-4 font-space text-[11px] font-semibold">
            {topProducts.map((p, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-brand-dark">{p.name}</span>
                  <span className="text-brand-primary">{p.value} units</span>
                </div>
                {/* Visual Bar container */}
                <div className="h-2.5 w-full bg-brand-cream rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      backgroundColor: p.color,
                      width: `${(p.value / 50) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Grid: Recent Orders & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Orders log (col-span-8) */}
        <div className="lg:col-span-8 bg-white border border-brand-sand rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-brand-sand pb-4 mb-4">
            <div>
              <h3 className="font-playfair text-sm font-bold text-brand-ocean">Recent Orders</h3>
              <p className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider mt-0.5">Last 5 purchases</p>
            </div>
            <Link to="/admin/orders" className="text-xs font-bold text-brand-primary hover:text-brand-secondary flex items-center gap-1 hover:underline">
              All Orders <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-sand text-brand-ocean font-bold">
                  <th className="py-3 pr-3">Order ID</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pl-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-sand/40 font-semibold text-brand-dark/80">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-brand-sand/5">
                    <td className="py-3 pr-3 font-mono text-brand-ocean font-bold">{o.id}</td>
                    <td className="py-3 px-3">{o.customerName}</td>
                    <td className="py-3 px-3 font-space">{new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td className="py-3 px-3 text-right font-space text-brand-primary">₹{o.total.toFixed(2)}</td>
                    <td className="py-3 px-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="py-3 pl-3 text-center">
                      <button
                        onClick={() => handleOpenDetails(o)}
                        className="p-1 text-brand-ocean hover:text-brand-primary hover:bg-brand-sand/30 rounded cursor-pointer"
                        title="View details"
                      >
                        <Eye className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock alert dashboard block (col-span-4) */}
        <div className="lg:col-span-4 bg-white border border-brand-sand rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div className="border-b border-brand-sand pb-4 mb-4">
            <h3 className="font-playfair text-sm font-bold text-brand-ocean flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" /> Low Stock Warning
            </h3>
            <p className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider mt-0.5">Stock thresholds &lt; 10 units</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[200px] pr-1 no-scrollbar">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-10 text-brand-dark/50 text-xs font-medium">
                ✅ All inventory levels are healthy!
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 border border-rose-100 bg-rose-50/20 rounded-xl gap-3 text-xs font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-brand-sand shrink-0">
                      <img src={p.image} alt={p.nameEn} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[11px] text-brand-dark line-clamp-1">{p.nameEn}</p>
                      <span className="text-[9px] bg-brand-sand px-1.5 py-0.5 rounded text-brand-ocean font-bold font-space">{p.weight}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 font-space shrink-0">
                    {p.stock} left
                  </span>
                </div>
              ))
            )}
          </div>
          <Link
            to="/admin/inventory"
            className="w-full text-center bg-brand-ocean hover:bg-brand-primary text-brand-cream py-2 rounded-xl text-xs font-bold shadow mt-4 transition-colors"
          >
            Manage Stock Levels
          </Link>
        </div>

      </div>

      {/* Details modal reuse */}
      {selectedOrder && (
        <Modal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          title={`Order details - ${selectedOrder.id}`}
        >
          <div className="space-y-5 text-xs font-semibold">
            {/* Quick status details */}
            <div className="flex justify-between items-center bg-brand-cream border border-brand-sand p-4 rounded-xl">
              <div>
                <p className="text-[9px] uppercase font-bold tracking-wider text-brand-dark/45 mb-0.5">Order Status</p>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase font-bold tracking-wider text-brand-dark/45 mb-0.5">Order Total</p>
                <span className="text-base font-bold text-brand-primary font-space">₹{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Address & Payment Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold tracking-wider text-brand-dark/45 mb-1">Customer Delivery Details</p>
                <p className="font-bold text-brand-ocean">{selectedOrder.customerName}</p>
                <p className="leading-relaxed font-medium text-brand-dark/75">{selectedOrder.address.doorNo}, {selectedOrder.address.street}, {selectedOrder.address.city} - {selectedOrder.address.pincode}</p>
                <p className="text-[10px] text-brand-dark/50">Phone: {selectedOrder.address.phone}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold tracking-wider text-brand-dark/45 mb-1">Order Particulars</p>
                <p className="flex justify-between text-brand-dark/75"><span>Method:</span> <strong>{selectedOrder.paymentMethod}</strong></p>
                <p className="flex justify-between text-brand-dark/75"><span>Payment:</span> <strong>{selectedOrder.paymentStatus}</strong></p>
                <p className="flex justify-between text-brand-dark/75"><span>Date:</span> <strong>{new Date(selectedOrder.date).toLocaleDateString()}</strong></p>
              </div>
            </div>

            {/* Basket Products */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase font-bold tracking-wider text-brand-dark/45 mb-1">Products list</p>
              <div className="divide-y divide-brand-sand/50 border border-brand-sand p-3 rounded-2xl">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="py-2 flex justify-between items-center gap-4 text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded border overflow-hidden shrink-0">
                        <img src={item.image} alt={item.nameEn} className="w-full.5 h-full.5 object-cover" />
                      </div>
                      <div>
                        <p className="font-tiro-tamil text-brand-primary font-bold">{item.nameTa}</p>
                        <p className="text-brand-dark/70">{item.nameEn} ({item.weight})</p>
                      </div>
                    </div>
                    <div className="font-space">
                      <span className="text-brand-dark/50 mr-2">{item.quantity} x ₹{item.price}</span>
                      <span className="font-bold text-brand-ocean">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex justify-end font-bold">
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="bg-brand-primary text-brand-cream px-6 py-2 rounded-xl text-xs hover:bg-brand-secondary active:scale-95 shadow cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
