import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Key, Save, Trash2, Plus, ShieldCheck, Mail, Phone, Smile } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import Breadcrumb from '../components/Breadcrumb';

export default function Profile() {
  const navigate = useNavigate();
  const { isLoggedIn, user, updateProfile, deleteAddress, addAddress } = useAuthStore();
  const addToast = useToastStore(state => state.addToast);

  const [activeTab, setActiveTab] = useState('personal');

  // Personal Info Form States
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  // Password Change Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Address add form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    fullName: '',
    phone: '',
    doorNo: '',
    street: '',
    city: '',
    pincode: '',
    state: 'Tamil Nadu'
  });

  // Load profile values
  useEffect(() => {
    if (!isLoggedIn) {
      addToast('Please login to view your profile details.', 'warning');
      navigate('/login');
      return;
    }
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone);
      setProfileEmail(user.email);
    }
  }, [isLoggedIn, user, navigate]);

  if (!isLoggedIn || !user) return null;

  const handleSavePersonalInfo = (e) => {
    e.preventDefault();
    if (!profileName || !profilePhone || !profileEmail) {
      addToast('Please fill in all profile details.', 'warning');
      return;
    }

    const success = updateProfile({
      name: profileName,
      phone: profilePhone,
      email: profileEmail
    });

    if (success) {
      addToast('Personal information updated successfully!', 'success');
    }
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      addToast('Please fill in all password fields.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match.', 'error');
      return;
    }

    // Simulate update
    setTimeout(() => {
      addToast('Password changed successfully!', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 500);
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddr.fullName || !newAddr.phone || !newAddr.doorNo || !newAddr.street || !newAddr.city || !newAddr.pincode) {
      addToast('Please fill in all address parameters.', 'warning');
      return;
    }

    addAddress(newAddr);
    addToast('Address added to directory!', 'success');
    setShowAddressForm(false);
    setNewAddr({
      fullName: '',
      phone: '',
      doorNo: '',
      street: '',
      city: '',
      pincode: '',
      state: 'Tamil Nadu'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-20 font-inter">
      <Breadcrumb items={[{ label: 'My Profile', link: '/profile' }]} />

      <h1 className="font-tiro-tamil text-2xl md:text-3xl text-brand-primary font-bold border-b border-brand-sand pb-4 mb-8">
        உங்களது சுயவிவரம்
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Avatar Panel & Tab buttons */}
        <div className="lg:col-span-4 bg-brand-cream border border-brand-sand rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
          <div className="palm-leaf-pattern absolute inset-0 opacity-10 pointer-events-none" />
          
          {/* Avatar info block */}
          <div className="text-center relative z-10 space-y-3">
            <div className="w-20 h-20 bg-brand-primary text-brand-cream font-bold text-2xl rounded-full flex items-center justify-center mx-auto shadow-md border-2 border-white">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="font-playfair text-lg font-bold text-brand-ocean">{user.name}</h3>
              <p className="text-[10px] text-brand-dark/45 uppercase tracking-wider font-bold">Customer Profile</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-col gap-2 relative z-10 pt-2 text-xs font-bold font-inter">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-brand-sand/20 text-left transition-colors cursor-pointer ${
                activeTab === 'personal' ? 'bg-brand-ocean text-brand-cream hover:bg-brand-ocean' : 'text-brand-dark/75'
              }`}
            >
              <User className="w-4.5 h-4.5" /> Personal Information
            </button>
            
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-brand-sand/20 text-left transition-colors cursor-pointer ${
                activeTab === 'addresses' ? 'bg-brand-ocean text-brand-cream hover:bg-brand-ocean' : 'text-brand-dark/75'
              }`}
            >
              <MapPin className="w-4.5 h-4.5" /> Saved Addresses
            </button>
            
            <button
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-brand-sand/20 text-left transition-colors cursor-pointer ${
                activeTab === 'password' ? 'bg-brand-ocean text-brand-cream hover:bg-brand-ocean' : 'text-brand-dark/75'
              }`}
            >
              <Key className="w-4.5 h-4.5" /> Change Password
            </button>
          </div>
        </div>

        {/* Right Side: Tab Contents Panel */}
        <div className="lg:col-span-8">
          
          {/* TAB 1: Personal Info */}
          {activeTab === 'personal' && (
            <div className="bg-white border border-brand-sand rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <h3 className="font-playfair text-base font-bold text-brand-ocean border-b border-brand-sand pb-3.5 flex items-center gap-2">
                <Smile className="w-5 h-5 text-brand-primary" /> Personal Details
              </h3>

              <form onSubmit={handleSavePersonalInfo} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium text-brand-dark/85"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label>Contact Phone Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, ''))}
                        className="bg-brand-cream border border-brand-sand rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium text-brand-dark/85"
                      />
                      <Phone className="w-4 h-4 text-brand-dark/40 absolute left-3 top-3.5" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 max-w-sm">
                  <label>Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="bg-brand-cream border border-brand-sand rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium text-brand-dark/85"
                    />
                    <Mail className="w-4 h-4 text-brand-dark/40 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="pt-2 flex">
                  <button
                    type="submit"
                    className="bg-brand-primary text-brand-cream py-2.5 px-6 rounded-xl font-bold flex items-center gap-1.5 hover:bg-brand-secondary active:scale-95 transition-all shadow cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Information
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Addresses directory */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="bg-white border border-brand-sand rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex justify-between items-center border-b border-brand-sand pb-3.5 mb-6">
                  <h3 className="font-playfair text-base font-bold text-brand-ocean flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-primary" /> Delivery Directory
                  </h3>
                  {!showAddressForm && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="text-xs font-bold text-brand-primary hover:text-brand-secondary flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Address
                    </button>
                  )}
                </div>

                {showAddressForm ? (
                  // Add Address Form
                  <form onSubmit={handleAddAddress} className="space-y-4 text-xs font-semibold">
                    <h4 className="text-xs font-bold text-brand-ocean uppercase tracking-wider mb-2">New Address Profile</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label>Consignee Name</label>
                        <input
                          type="text"
                          required
                          value={newAddr.fullName}
                          onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                          placeholder="e.g. Balaji Se"
                          className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          required
                          pattern="[0-9]{10}"
                          value={newAddr.phone}
                          onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value.replace(/\D/g, '') })}
                          placeholder="10-digit number"
                          className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label>Door / Flat No.</label>
                        <input
                          type="text"
                          required
                          value={newAddr.doorNo}
                          onChange={(e) => setNewAddr({ ...newAddr, doorNo: e.target.value })}
                          placeholder="e.g. 14/3"
                          className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label>Street Name</label>
                        <input
                          type="text"
                          required
                          value={newAddr.street}
                          onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                          placeholder="e.g. East Coast Road"
                          className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label>City</label>
                        <input
                          type="text"
                          required
                          value={newAddr.city}
                          onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                          placeholder="e.g. Chennai"
                          className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label>Pincode</label>
                        <input
                          type="text"
                          required
                          pattern="[0-9]{6}"
                          value={newAddr.pincode}
                          onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value.replace(/\D/g, '') })}
                          placeholder="6-digit"
                          className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label>State</label>
                        <select
                          value={newAddr.state}
                          onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                          className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary cursor-pointer font-medium"
                        >
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Kerala">Kerala</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Andhra Pradesh">Andhra Pradesh</option>
                          <option value="Pondicherry">Pondicherry</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2 justify-end font-bold text-xs">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="border border-brand-sand px-4 py-2.5 rounded-xl hover:bg-brand-sand/15 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-brand-primary text-brand-cream px-6 py-2.5 rounded-xl hover:bg-brand-secondary active:scale-95 shadow cursor-pointer"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                ) : user.addresses.length === 0 ? (
                  <div className="text-center py-6 text-brand-dark/50 font-medium">
                    No shipping addresses saved yet. Click "Add Address" to register.
                  </div>
                ) : (
                  // Addresses grid
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="bg-white border border-brand-sand p-4.5 rounded-2xl shadow-sm relative group flex items-start gap-2.5"
                      >
                        <div className="text-xs text-brand-dark/80 font-medium space-y-1">
                          <p className="font-bold text-brand-ocean flex items-center gap-1.5">
                            {addr.fullName} 
                            {addr.isDefault && <span className="bg-brand-sand text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase">Default</span>}
                          </p>
                          <p className="text-[11px] leading-relaxed">
                            {addr.doorNo}, {addr.street}, {addr.city} - {addr.pincode}, {addr.state}
                          </p>
                          <p className="text-[10px] text-brand-dark/45 pt-1">📞 Contact: {addr.phone}</p>
                        </div>
                        <button
                          onClick={() => {
                            deleteAddress(addr.id);
                            addToast('Address deleted from profile directory', 'info');
                          }}
                          className="absolute top-3 right-3 p-1 bg-rose-50 text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Change Password */}
          {activeTab === 'password' && (
            <div className="bg-white border border-brand-sand rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <h3 className="font-playfair text-base font-bold text-brand-ocean border-b border-brand-sand pb-3.5 flex items-center gap-2">
                <Key className="w-5 h-5 text-brand-primary" /> Modify Password
              </h3>

              <form onSubmit={handleSavePassword} className="space-y-4 text-xs font-semibold max-w-sm">
                <div className="flex flex-col gap-1.5">
                  <label>Current Account Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label>New Account Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label>Re-type New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
                  />
                </div>

                <div className="pt-2 flex">
                  <button
                    type="submit"
                    className="bg-brand-primary text-brand-cream py-2.5 px-6 rounded-xl font-bold flex items-center gap-1.5 hover:bg-brand-secondary active:scale-95 transition-all shadow cursor-pointer"
                  >
                    <Key className="w-4 h-4" /> Change Password
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
