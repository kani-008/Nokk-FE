import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, CheckCircle2, Eye, ShieldCheck, Mail, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';

export default function UsersList() {
  const addToast = useToastStore(state => state.addToast);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [userOrders, setUserOrders] = useState([]);

  const loadUsersList = () => {
    api.getUsers().then(setUsers);
  };

  useEffect(() => {
    loadUsersList();
  }, []);

  const handleToggleBlock = (id, name, currentStatus) => {
    api.toggleUserStatus(id).then(() => {
      const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
      addToast(`Customer "${name}" status toggled to: ${newStatus}`, 'info');
      loadUsersList();
    });
  };

  const handleOpenHistory = (userRecord) => {
    setSelectedUser(userRecord);
    // filter orders by user email
    api.getOrders().then(allOrders => {
      const history = allOrders.filter(o => o.customerEmail.toLowerCase() === userRecord.email.toLowerCase());
      setUserOrders(history);
      setIsHistoryOpen(true);
    });
  };

  // Columns definition for customers log
  const tableColumns = [
    {
      key: 'name',
      label: 'Customer Profile',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-ocean/10 text-brand-ocean font-bold flex items-center justify-center border border-brand-sand shrink-0 shadow-sm">
            {row.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-bold text-brand-dark">{row.name}</p>
            {row.role === 'admin' && <span className="bg-brand-secondary/15 text-brand-secondary text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Staff</span>}
          </div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email Address',
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-brand-dark/45" /> {row.email}</span>
      )
    },
    {
      key: 'phone',
      label: 'Phone Contact',
      render: (row) => <span className="font-space">{row.phone}</span>
    },
    {
      key: 'joinedDate',
      label: 'Registration Date',
      sortable: true,
      render: (row) => <span className="font-space text-brand-dark/65 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-brand-dark/35" /> {row.joinedDate}</span>
    },
    {
      key: 'ordersCount',
      label: 'Purchases count',
      sortable: true,
      render: (row) => <span className="font-space bg-brand-cream border border-brand-sand/55 px-2 py-0.5 rounded-full font-bold text-brand-ocean">{row.ordersCount} orders</span>
    },
    {
      key: 'status',
      label: 'Status Code',
      sortable: true,
      render: (row) => (
        <button
          onClick={() => handleToggleBlock(row.id, row.name, row.status)}
          disabled={row.role === 'admin'}
          className={`flex items-center gap-1 font-bold text-[10px] uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
          title={row.role === 'admin' ? 'Cannot block staff' : 'Toggle access'}
        >
          {row.status === 'Active' ? (
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
            </span>
          ) : (
            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Blocked
            </span>
          )}
        </button>
      )
    },
    {
      key: 'actions',
      label: 'History',
      render: (row) => (
        <button
          onClick={() => handleOpenHistory(row)}
          className="p-1.5 border border-brand-sand hover:border-brand-ocean bg-white text-brand-ocean rounded-xl transition-all cursor-pointer shadow-sm"
          title="View purchases"
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
          <h1 className="font-playfair text-2xl font-bold text-brand-ocean">Customer Log</h1>
          <p className="text-xs text-brand-dark/50 font-medium mt-1">Review registered client directories and toggle blacklist status controls</p>
        </div>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={tableColumns}
        data={users}
        searchPlaceholder="Search customer logs by Name, Email or Phone..."
        searchKeys={['name', 'email', 'phone', 'joinedDate', 'status']}
      />

      {/* User Purchases list modal */}
      {selectedUser && (
        <Modal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          title={`Order History - ${selectedUser.name}`}
        >
          <div className="space-y-6 text-xs font-semibold">
            {/* Quick Customer Profile */}
            <div className="flex gap-4 p-4 border border-brand-sand bg-brand-cream rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-brand-primary text-brand-cream flex items-center justify-center font-bold text-sm border-2 border-white">
                {selectedUser.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-brand-ocean">{selectedUser.name}</h4>
                <p className="text-brand-dark/65 font-medium mt-0.5">{selectedUser.email}</p>
                <p className="text-brand-dark/45 font-medium">Joined on {selectedUser.joinedDate}</p>
              </div>
            </div>

            {/* List orders */}
            <div className="space-y-3">
              <h4 className="text-[10px] text-brand-dark/45 uppercase tracking-wider font-bold">Transaction logs ({userOrders.length})</h4>
              
              {userOrders.length === 0 ? (
                <div className="text-center py-6 text-brand-dark/50 font-medium bg-white border border-brand-sand rounded-xl">
                  No purchases found under this account email.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {userOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-brand-sand p-3.5 rounded-xl flex items-center justify-between gap-4 font-space"
                    >
                      <div className="space-y-1 text-left text-xs font-semibold">
                        <span className="text-brand-ocean font-bold tracking-wider font-mono block">{order.id}</span>
                        <span className="text-[10.5px] text-brand-dark/60 font-medium block">
                          {new Date(order.date).toLocaleDateString()} • {order.items.length} items
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-3 shrink-0">
                        <div>
                          <span className="text-brand-primary font-bold block text-sm">₹{order.total.toFixed(2)}</span>
                          <span className="text-[9px] text-brand-dark/40 font-medium block">{order.paymentMethod}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          order.status === 'Processing' 
                            ? 'bg-amber-50 text-amber-800' 
                            : order.status === 'Delivered' 
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer close action */}
            <div className="pt-2 flex justify-end font-bold">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="bg-brand-primary text-brand-cream px-6 py-2 rounded-xl text-xs hover:bg-brand-secondary active:scale-95 shadow cursor-pointer"
              >
                Close Logs
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
