import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Edit2, Trash2, Calendar, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';

export default function OffersCoupons() {
  const addToast = useToastStore(state => state.addToast);

  const [activeTab, setActiveTab] = useState('coupons'); // offers | coupons
  const [coupons, setCoupons] = useState([]);
  
  // Simulated dynamic campaigns
  const [campaigns, setCampaigns] = useState([
    { id: 'camp-1', name: 'Aadi Festival Special', discount: '10% OFF', scope: 'Pickles Category', dateRange: 'July 15 - Aug 15', active: true },
    { id: 'camp-2', name: 'Nethili Bulk Saver', discount: '15% OFF', scope: '1kg Anchovies', dateRange: 'June 01 - June 30', active: false }
  ]);

  // Modal Coupon states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [discountFlat, setDiscountFlat] = useState(0);
  const [minOrder, setMinOrder] = useState(500);
  const [maxUses, setMaxUses] = useState(100);
  const [expiry, setExpiry] = useState('2026-12-31');
  const [description, setDescription] = useState('');

  const loadCoupons = () => {
    api.getCoupons().then(setCoupons);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountPercent(10);
    setDiscountFlat(0);
    setMinOrder(500);
    setMaxUses(100);
    setExpiry('2026-12-31');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountPercent(coupon.discountPercent || 0);
    setDiscountFlat(coupon.discountFlat || 0);
    setMinOrder(coupon.minOrder || 0);
    setMaxUses(coupon.maxUses || 0);
    setExpiry(coupon.expiry || '2026-12-31');
    setDescription(coupon.description || '');
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!code || !description) {
      addToast('Please fill in required coupon particulars.', 'warning');
      return;
    }

    const payload = {
      code: code.toUpperCase().trim(),
      discountPercent: parseInt(discountPercent) || 0,
      discountFlat: parseInt(discountFlat) || 0,
      minOrder: parseInt(minOrder) || 0,
      maxUses: parseInt(maxUses) || 0,
      expiry,
      usageCount: editingCoupon?.usageCount || 0,
      description
    };

    api.saveCoupon(payload).then(() => {
      addToast(editingCoupon ? 'Coupon modified successfully!' : 'New Coupon campaign active!', 'success');
      setIsModalOpen(false);
      loadCoupons();
    });
  };

  const handleDelete = (codeVal) => {
    if (window.confirm(`Are you sure you want to delete Coupon code: "${codeVal}"?`)) {
      api.deleteCoupon(codeVal).then(() => {
        addToast('Coupon deleted from campaigns database.', 'info');
        loadCoupons();
      });
    }
  };

  const handleToggleCampaign = (id, name, current) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, active: !current } : c));
    addToast(`Campaign "${name}" status toggled.`, 'info');
  };

  // Columns definition for Coupons ledger
  const couponColumns = [
    {
      key: 'code',
      label: 'Coupon Code',
      sortable: true,
      render: (row) => <span className="font-mono bg-brand-sand/50 text-brand-ocean px-3 py-1 rounded text-xs font-bold tracking-wider">{row.code}</span>
    },
    {
      key: 'description',
      label: 'Campaign Particulars',
      sortable: true,
      render: (row) => <span className="font-medium text-brand-dark/85">{row.description}</span>
    },
    {
      key: 'discountPercent',
      label: 'Discount Rate',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-brand-primary font-space">
          {row.discountPercent > 0 ? `${row.discountPercent}% OFF` : `Flat ₹${row.discountFlat} OFF`}
        </span>
      )
    },
    {
      key: 'minOrder',
      label: 'Min order Required',
      sortable: true,
      render: (row) => <span className="font-space font-medium text-brand-dark/75">₹{row.minOrder}</span>
    },
    {
      key: 'maxUses',
      label: 'Max Uses / Applied',
      render: (row) => <span className="font-space text-brand-dark/70 font-semibold">{row.usageCount} / {row.maxUses} uses</span>
    },
    {
      key: 'expiry',
      label: 'Expiry Date',
      sortable: true,
      render: (row) => <span className="font-space text-brand-dark/50 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-brand-dark/35" /> {row.expiry}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1 text-brand-ocean hover:text-brand-primary hover:bg-brand-sand/30 rounded cursor-pointer"
            title="Edit Coupon"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.code)}
            className="p-1 text-brand-dark/40 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
            title="Delete Coupon"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 font-inter pb-10">
      {/* Page Headers */}
      <div className="flex justify-between items-center border-b border-brand-sand pb-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-brand-ocean">Marketing campaigns</h1>
          <p className="text-xs text-brand-dark/50 font-medium mt-1">Configure active customer coupons, discount rates, and catalog campaigns</p>
        </div>
        {activeTab === 'coupons' && (
          <button
            onClick={handleOpenAdd}
            className="bg-brand-primary text-brand-cream py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-brand-secondary active:scale-95 transition-all shadow flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" /> Create Coupon
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-sand gap-6 pb-0.5">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-1.5 pb-3 font-bold text-xs md:text-sm border-b-2 shrink-0 transition-colors cursor-pointer ${
            activeTab === 'coupons' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-dark/50 hover:text-brand-ocean'
          }`}
        >
          Customer Coupons
          <span className="text-[10px] bg-brand-sand text-brand-ocean px-1.5 py-0.5 rounded-full font-space">{coupons.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`flex items-center gap-1.5 pb-3 font-bold text-xs md:text-sm border-b-2 shrink-0 transition-colors cursor-pointer ${
            activeTab === 'offers' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-dark/50 hover:text-brand-ocean'
          }`}
        >
          Catalog Discount campaigns
          <span className="text-[10px] bg-brand-sand text-brand-ocean px-1.5 py-0.5 rounded-full font-space">{campaigns.length}</span>
        </button>
      </div>

      {/* Contents */}
      {activeTab === 'coupons' ? (
        <DataTable
          columns={couponColumns}
          data={coupons}
          searchPlaceholder="Search coupons by code or description..."
          searchKeys={['code', 'description', 'expiry']}
        />
      ) : (
        // campaigns list
        <div className="bg-white border border-brand-sand rounded-2xl shadow-sm overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-cream border-b border-brand-sand text-brand-ocean font-bold">
                  <th className="px-6 py-4">Campaign Name</th>
                  <th className="px-6 py-4">Discount Applied</th>
                  <th className="px-6 py-4">Target Scope</th>
                  <th className="px-6 py-4">Campaign Validity</th>
                  <th className="px-6 py-4">Campaign Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-sand font-semibold text-brand-dark/80">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-brand-sand/5">
                    <td className="px-6 py-3.5 text-brand-ocean font-bold">{camp.name}</td>
                    <td className="px-6 py-3.5 text-brand-primary font-bold font-space">{camp.discount}</td>
                    <td className="px-6 py-3.5 text-brand-dark/75">{camp.scope}</td>
                    <td className="px-6 py-3.5 font-space text-brand-dark/50 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-brand-dark/35" /> {camp.dateRange}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        camp.active 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}>
                        {camp.active ? 'ACTIVE' : 'COMPLETED'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleCampaign(camp.id, camp.name, camp.active)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          camp.active 
                            ? 'bg-white hover:bg-rose-50 text-rose-600 border-brand-sand' 
                            : 'bg-brand-ocean text-brand-cream border-brand-ocean hover:bg-brand-primary'
                        }`}
                      >
                        {camp.active ? 'Stop Campaign' : 'Launch Campaign'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? `Edit Coupon Campaign - ${code}` : 'Activate New Discount Coupon'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Coupon Code */}
            <div className="flex flex-col gap-1.5">
              <label>Coupon Code <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                disabled={editingCoupon !== null}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. DISH15"
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-mono tracking-wider font-bold text-brand-ocean disabled:opacity-40"
              />
            </div>
            {/* Expiry Date */}
            <div className="flex flex-col gap-1.5">
              <label>Expiry Date <span className="text-rose-500">*</span></label>
              <input
                type="date"
                required
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-mono text-brand-dark/75"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Discount percent */}
            <div className="flex flex-col gap-1.5">
              <label>Discount Rate (%)</label>
              <input
                type="number"
                min="0"
                max="90"
                value={discountPercent}
                onChange={(e) => {
                  setDiscountPercent(parseInt(e.target.value) || 0);
                  setDiscountFlat(0); // clear flat if percent is set
                }}
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>
            {/* Discount flat amount */}
            <div className="flex flex-col gap-1.5">
              <label>Discount Flat (₹)</label>
              <input
                type="number"
                min="0"
                value={discountFlat}
                onChange={(e) => {
                  setDiscountFlat(parseInt(e.target.value) || 0);
                  setDiscountPercent(0); // clear percent if flat is set
                }}
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>
            {/* Min order threshold */}
            <div className="flex flex-col gap-1.5">
              <label>Min Order (₹)</label>
              <input
                type="number"
                min="0"
                value={minOrder}
                onChange={(e) => setMinOrder(parseInt(e.target.value) || 0)}
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-space"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Max uses limit */}
            <div className="flex flex-col gap-1.5">
              <label>Max Uses Limit</label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-space"
              />
            </div>
            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label>Campaign Title/Description <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 10% OFF on all Dry Fish gravies"
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex justify-end gap-3 border-t border-brand-sand font-bold text-xs">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="border border-brand-sand px-5 py-2.5 rounded-xl hover:bg-brand-sand/15 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-brand-primary text-brand-cream px-6 py-2.5 rounded-xl hover:bg-brand-secondary active:scale-95 transition-all shadow cursor-pointer"
            >
              {editingCoupon ? 'Save Campaign Changes' : 'Activate Campaign'}
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
