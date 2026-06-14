import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowRight, Eye, Calendar, DollarSign, User, MapPin, Check, FileDown, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { mockAPI } from '../data/mockData';
import OrderStatusBadge from '../components/OrderStatusBadge';
import Breadcrumb from '../components/Breadcrumb';
import Modal from '../components/Modal';

export default function MyOrders() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const addToast = useToastStore(state => state.addToast);

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Auth protection check
  useEffect(() => {
    if (!isLoggedIn) {
      addToast('Please login to view your orders.', 'warning');
      navigate('/login');
      return;
    }
    
    // Fetch user specific orders
    const allOrders = mockAPI.getOrders();
    const userOrders = allOrders.filter(o => o.customerEmail.toLowerCase() === user.email.toLowerCase());
    setOrders(userOrders);
  }, [isLoggedIn, user, navigate]);

  if (!isLoggedIn || !user) return null;

  const tabs = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'All') return true;
    return o.status === activeTab;
  });

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleDownloadInvoice = (orderId) => {
    addToast(`Downloading invoice for order ${orderId} as PDF...`, 'success');
  };

  const getTimelineStep = (status) => {
    switch (status) {
      case 'Processing': return 1;
      case 'Shipped': return 2;
      case 'Delivered': return 3;
      default: return 0; // Cancelled
    }
  };

  const timelineStep = selectedOrder ? getTimelineStep(selectedOrder.status) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-20 font-inter">
      <Breadcrumb items={[{ label: 'My Orders', link: '/my-orders' }]} />

      <h1 className="font-tiro-tamil text-2xl md:text-3xl text-brand-primary font-bold border-b border-brand-sand pb-4 mb-8">
        ஆர்டர் வரலாறு
      </h1>

      {/* Tabs list */}
      <div className="flex border-b border-brand-sand gap-6 overflow-x-auto no-scrollbar pb-0.5 mb-8">
        {tabs.map((tab) => {
          const count = tab === 'All' 
            ? orders.length 
            : orders.filter(o => o.status === tab).length;
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 pb-3.5 font-bold text-xs md:text-sm border-b-2 shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-dark/50 hover:text-brand-ocean'
              }`}
            >
              {tab}
              <span className={`text-[10px] font-bold font-space px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-brand-primary text-brand-cream' : 'bg-brand-sand text-brand-dark/65'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-16 bg-brand-cream/20 border border-brand-sand rounded-3xl text-center max-w-xl mx-auto shadow-sm">
          <div className="p-4 bg-brand-sand/35 rounded-full mb-4 text-brand-dark/40">
            <ClipboardList className="w-12 h-12" />
          </div>
          <h3 className="font-playfair text-lg font-bold text-brand-ocean">No orders found</h3>
          <p className="text-xs text-brand-dark/60 mt-1.5 max-w-xs leading-relaxed">
            There are no orders listed under the status "<strong>{activeTab}</strong>" right now.
          </p>
          <button
            onClick={() => navigate('/products')}
            className="mt-6 bg-brand-primary text-brand-cream px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-secondary active:scale-95 transition-all shadow"
          >
            Browse Store
          </button>
        </div>
      ) : (
        // Orders List Grid
        <div className="space-y-4 max-w-4xl mx-auto">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-brand-sand rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4 relative border-l-4 border-l-brand-ocean"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-brand-dark/60 font-space">
                  <span className="text-brand-ocean font-bold tracking-wider font-mono">{order.id}</span>
                  <span className="text-brand-dark/30">•</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-brand-primary" /> {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>

                {/* Items strip */}
                <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar pt-1.5">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 rounded-lg border border-brand-sand overflow-hidden shrink-0 bg-brand-cream/20"
                      title={`${item.nameEn} (${item.weight})`}
                    >
                      <img src={item.image} alt={item.nameEn} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Total and badges */}
              <div className="flex items-center justify-between md:justify-end gap-6 border-t border-brand-sand/50 md:border-t-0 pt-3 md:pt-0">
                <div className="text-left md:text-right font-space">
                  <span className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider block mb-0.5">Amount Paid</span>
                  <span className="text-base font-bold text-brand-primary">₹{order.total.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <button
                    onClick={() => handleOpenDetails(order)}
                    className="p-2 border border-brand-sand hover:border-brand-ocean bg-white text-brand-ocean hover:bg-brand-ocean/5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm"
                    title="View Details"
                  >
                    <Eye className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Order details - ${selectedOrder.id}`}
        >
          <div className="space-y-6 text-xs font-semibold">
            {/* 1. Timeline Status Tracker */}
            {selectedOrder.status !== 'Cancelled' ? (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-brand-dark/45 uppercase tracking-wider">Delivery Stage Timeline</p>
                <div className="relative flex justify-between items-center py-2 max-w-xs mx-auto font-space text-[10px]">
                  {/* Background line */}
                  <div className="absolute inset-x-0 h-1 bg-brand-sand top-5 z-0" />
                  <div
                    className="absolute h-1 bg-emerald-600 top-5 z-0 transition-all duration-500"
                    style={{
                      width: timelineStep === 1 ? '0%' : timelineStep === 2 ? '50%' : '100%',
                      left: '0%'
                    }}
                  />
                  
                  {/* Step 1 */}
                  <div className="flex flex-col items-center z-10">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white shadow ${timelineStep >= 1 ? 'bg-emerald-600' : 'bg-brand-sand text-brand-dark/65'}`}>
                      {timelineStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                    </div>
                    <span className="mt-1 font-bold text-brand-ocean">Processing</span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center z-10">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white shadow ${timelineStep >= 2 ? 'bg-emerald-600' : 'bg-brand-sand text-brand-dark/65'}`}>
                      {timelineStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                    </div>
                    <span className="mt-1 font-bold text-brand-ocean">Shipped</span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center z-10">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white shadow ${timelineStep >= 3 ? 'bg-emerald-600' : 'bg-brand-sand text-brand-dark/65'}`}>
                      {timelineStep > 3 ? <Check className="w-4 h-4" /> : '3'}
                    </div>
                    <span className="mt-1 font-bold text-brand-ocean">Delivered</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl font-bold flex items-center justify-center">
                🚫 This order was cancelled.
              </div>
            )}

            {/* 2. Addresses and Payments info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-brand-sand pt-4">
              <div className="space-y-1 text-brand-dark/75">
                <p className="text-[10px] font-bold text-brand-dark/45 uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-brand-primary" /> Delivery Address</p>
                <p className="font-bold text-brand-dark">{selectedOrder.address.fullName}</p>
                <p className="leading-relaxed">{selectedOrder.address.doorNo}, {selectedOrder.address.street}, {selectedOrder.address.city} - {selectedOrder.address.pincode}</p>
                <p className="text-[10px] text-brand-dark/50">Phone: {selectedOrder.address.phone}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-brand-dark/45 uppercase tracking-wider mb-1">Billing coordinates</p>
                <div className="space-y-1">
                  <p className="flex justify-between text-brand-dark/70"><span>Payment Method:</span> <strong className="text-brand-dark">{selectedOrder.paymentMethod}</strong></p>
                  <p className="flex justify-between text-brand-dark/70"><span>Payment Status:</span> <strong className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">{selectedOrder.paymentStatus}</strong></p>
                  <p className="flex justify-between text-brand-dark/70"><span>Order Date:</span> <strong>{new Date(selectedOrder.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong></p>
                </div>
              </div>
            </div>

            {/* 3. Itemized List */}
            <div className="border-t border-brand-sand pt-4 space-y-3.5">
              <p className="text-[10px] font-bold text-brand-dark/45 uppercase tracking-wider">Itemized basket</p>
              <div className="divide-y divide-brand-sand/50 bg-white border border-brand-sand/55 p-3 rounded-2xl">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-4 font-semibold text-[11px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg overflow-hidden border border-brand-sand shrink-0">
                        <img src={item.image} alt={item.nameEn} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-tiro-tamil text-brand-primary font-bold">{item.nameTa}</p>
                        <p className="font-playfair text-brand-dark/70">{item.nameEn} ({item.weight})</p>
                      </div>
                    </div>
                    <div className="font-space">
                      <span className="text-brand-dark/50 mr-2">{item.quantity} x ₹{item.price}</span>
                      <span className="text-brand-ocean font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Math totals breakdown */}
            <div className="border-t border-brand-sand pt-4 space-y-2 max-w-xs ml-auto text-xs font-semibold">
              <div className="flex justify-between text-brand-dark/70">
                <span>Items Subtotal</span>
                <span className="font-space">₹{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount ({selectedOrder.couponApplied})</span>
                  <span className="font-space">- ₹{selectedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-brand-dark/70">
                <span>Shipping charge</span>
                <span className="font-space">{selectedOrder.deliveryCharge === 0 ? 'Free' : `₹${selectedOrder.deliveryCharge.toFixed(2)}`}</span>
              </div>
              <div className="border-t border-brand-sand pt-2.5 flex justify-between font-bold text-brand-ocean text-sm">
                <span>Grand Total</span>
                <span className="font-space text-brand-primary text-base">₹{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2.5 pt-4 border-t border-brand-sand font-bold text-xs justify-end">
              <button
                onClick={() => handleDownloadInvoice(selectedOrder.id)}
                className="border border-brand-sand px-4 py-2.5 rounded-xl hover:bg-brand-sand/15 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileDown className="w-4 h-4 text-brand-primary" /> Invoice PDF
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-brand-primary text-brand-cream px-5 py-2.5 rounded-xl hover:bg-brand-secondary active:scale-95 transition-all shadow cursor-pointer"
              >
                Close details
              </button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
