import React, { useState, useEffect } from 'react';
import { ClipboardList, Eye, CheckCircle2, XCircle, ArrowRight, Truck, MapPin, Calendar, FileText, IndianRupee } from 'lucide-react';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import DataTable from '../../components/DataTable';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import Modal from '../../components/Modal';

export default function Orders() {
  const addToast = useToastStore(state => state.addToast);

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all | returns
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Return request simulated database
  const [returnRequests, setReturnRequests] = useState([
    { id: 'RET-4321', orderId: 'ORD-9532', customerName: 'Deepak Kumar', item: 'Sura Karuvadu (500g)', reason: 'Item received had minor tearing on outer seal pack.', status: 'Pending' }
  ]);

  const loadOrders = () => {
    api.getOrders().then(setOrders);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = (id, newStatus) => {
    api.updateOrderStatus(id, newStatus).then(() => {
      addToast(`Order ${id} status updated to: ${newStatus}`, 'success');
      loadOrders();
    });
  };

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleResolveReturn = (id, action) => {
    setReturnRequests(prev => prev.map(r => r.id === id ? { ...r, status: action === 'approve' ? 'Approved' : 'Rejected' } : r));
    addToast(`Return request ${id} ${action === 'approve' ? 'approved & refund initiated' : 'rejected'}.`, 'info');
  };

  // Columns definition for orders log
  const tableColumns = [
    {
      key: 'id',
      label: 'Order ID',
      sortable: true,
      render: (row) => <span className="font-mono text-brand-ocean font-bold">{row.id}</span>
    },
    {
      key: 'customerName',
      label: 'Customer Details',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-brand-dark">{row.customerName}</p>
          <p className="text-[10px] text-brand-dark/50">{row.customerPhone} • {row.customerEmail}</p>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date & Time',
      sortable: true,
      render: (row) => <span className="font-space">{new Date(row.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    },
    {
      key: 'total',
      label: 'Order Total',
      sortable: true,
      render: (row) => <span className="font-space text-brand-primary font-bold">₹{row.total.toFixed(2)}</span>
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      sortable: true,
      render: (row) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-amber-50 text-amber-800 border border-amber-100'}`}>
          {row.paymentStatus}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Order Stage',
      sortable: true,
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          className="bg-brand-cream border border-brand-sand rounded-xl px-2 py-1 text-[11px] font-bold text-brand-ocean focus:outline-none cursor-pointer"
        >
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      )
    },
    {
      key: 'actions',
      label: 'Details',
      render: (row) => (
        <button
          onClick={() => handleOpenDetails(row)}
          className="p-1.5 border border-brand-sand hover:border-brand-ocean bg-white text-brand-ocean rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 font-inter pb-10">
      {/* Headers */}
      <div className="flex justify-between items-center border-b border-brand-sand pb-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-brand-ocean">Orders Ledger</h1>
          <p className="text-xs text-brand-dark/50 font-medium mt-1">Verify transactions, update dispatch schedules, and handle return requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-sand gap-6 pb-0.5">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 pb-3 font-bold text-xs md:text-sm border-b-2 shrink-0 transition-colors cursor-pointer ${
            activeTab === 'all' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-dark/50 hover:text-brand-ocean'
          }`}
        >
          All Orders
          <span className="text-[10px] bg-brand-sand text-brand-ocean px-1.5 py-0.5 rounded-full font-space">{orders.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`flex items-center gap-1.5 pb-3 font-bold text-xs md:text-sm border-b-2 shrink-0 transition-colors cursor-pointer ${
            activeTab === 'returns' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-dark/50 hover:text-brand-ocean'
          }`}
        >
          Return/Refund Requests
          <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-full font-space">
            {returnRequests.filter(r => r.status === 'Pending').length}
          </span>
        </button>
      </div>

      {/* Contents */}
      {activeTab === 'all' ? (
        <DataTable
          columns={tableColumns}
          data={orders}
          searchPlaceholder="Search order logs by ID, Name or Email..."
          searchKeys={['id', 'customerName', 'customerEmail', 'status', 'paymentMethod']}
        />
      ) : (
        // Return requests list
        <div className="bg-white border border-brand-sand rounded-2xl shadow-sm overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-cream border-b border-brand-sand text-brand-ocean font-bold">
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Item details</th>
                  <th className="px-6 py-4">Reason for Return</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-sand font-semibold text-brand-dark/80">
                {returnRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-brand-sand/5">
                    <td className="px-6 py-3.5 font-mono font-bold text-brand-primary">{req.id}</td>
                    <td className="px-6 py-3.5 font-mono text-brand-ocean">{req.orderId}</td>
                    <td className="px-6 py-3.5">{req.customerName}</td>
                    <td className="px-6 py-3.5 text-brand-ocean">{req.item}</td>
                    <td className="px-6 py-3.5 font-medium text-brand-dark/65 max-w-xs">{req.reason}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        req.status === 'Pending' 
                          ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                          : req.status === 'Approved' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {req.status === 'Pending' ? (
                        <div className="flex gap-2 justify-center font-bold">
                          <button
                            onClick={() => handleResolveReturn(req.id, 'approve')}
                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleResolveReturn(req.id, 'reject')}
                            className="border border-brand-sand hover:bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-brand-dark/40 font-medium">No actions pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice details drawer modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detailed Dispatch Ledger - ${selectedOrder.id}`}
        >
          <div className="space-y-6 text-xs font-semibold">
            <div className="flex justify-between items-center border-b border-brand-sand pb-4">
              <div className="space-y-1">
                <span className="text-[10px] text-brand-dark/45 uppercase tracking-wider font-bold">Customer Contact</span>
                <p className="text-sm font-bold text-brand-ocean">{selectedOrder.customerName}</p>
                <p className="text-xs text-brand-dark/65 font-medium">{selectedOrder.customerPhone} • {selectedOrder.customerEmail}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-brand-dark/45 uppercase tracking-wider font-bold block mb-1">Status Pill</span>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <p className="text-[10px] text-brand-dark/45 uppercase tracking-wider font-bold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-brand-primary" /> Shipping Destination</p>
              <div className="bg-brand-cream border border-brand-sand p-4 rounded-2xl text-brand-dark/75 leading-relaxed font-medium">
                <p className="font-bold text-brand-dark">{selectedOrder.address.fullName}</p>
                <p>{selectedOrder.address.doorNo}, {selectedOrder.address.street}, {selectedOrder.address.city} - {selectedOrder.address.pincode}</p>
                <p className="text-[10px] text-brand-dark/55 pt-1">State: {selectedOrder.address.state}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              <p className="text-[10px] text-brand-dark/45 uppercase tracking-wider font-bold flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5 text-brand-primary" /> Invoice Items list</p>
              <div className="divide-y divide-brand-sand/50 border border-brand-sand p-3 rounded-2xl bg-white">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="py-2.5 flex justify-between items-center gap-4 text-[11.5px]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded border overflow-hidden shrink-0">
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

            {/* Calculations breakdown */}
            <div className="space-y-2 border-t border-brand-sand pt-4 max-w-xs ml-auto text-xs font-semibold">
              <div className="flex justify-between text-brand-dark/70">
                <span>Subtotal Value</span>
                <span className="font-space">₹{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount ({selectedOrder.couponApplied})</span>
                  <span className="font-space">- ₹{selectedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-brand-dark/70">
                <span>Shipping Fee</span>
                <span className="font-space">{selectedOrder.deliveryCharge === 0 ? 'Free' : `₹${selectedOrder.deliveryCharge.toFixed(2)}`}</span>
              </div>
              <div className="border-t border-brand-sand pt-2.5 flex justify-between font-bold text-brand-ocean text-sm">
                <span>Grand Total</span>
                <span className="font-space text-brand-primary text-base">₹{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-4 flex justify-end gap-3 font-bold border-t border-brand-sand">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="bg-brand-primary text-brand-cream px-6 py-2 rounded-xl text-xs hover:bg-brand-secondary active:scale-95 transition-all shadow cursor-pointer"
              >
                Close Dispatch details
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
