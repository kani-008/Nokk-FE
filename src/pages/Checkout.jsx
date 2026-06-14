import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, CreditCard, ShoppingBag, CheckCircle, ArrowLeft, ArrowRight, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { useToastStore } from '../stores/toastStore';
import { api } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';

export default function Checkout() {
  const navigate = useNavigate();
  const { isLoggedIn, user, addAddress, deleteAddress } = useAuthStore();
  const { items, getCartTotals, clearCart } = useCartStore();
  const addToast = useToastStore(state => state.addToast);

  // Protected route check
  useEffect(() => {
    if (!isLoggedIn) {
      addToast('Please login to proceed to checkout.', 'warning');
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  // Steps: 1 = Address, 2 = Payment, 3 = Confirm, 4 = Success
  const [step, setStep] = useState(1);

  // Address Step States
  const [selectedAddressId, setSelectedAddressId] = useState(
    user?.addresses?.find(a => a.isDefault)?.id || user?.addresses?.[0]?.id || null
  );
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    doorNo: '',
    street: '',
    city: '',
    pincode: '',
    state: 'Tamil Nadu'
  });

  // Payment Step States
  const [paymentMethod, setPaymentMethod] = useState('UPI (GPay/PhonePe)');

  // Success Order State
  const [placedOrder, setPlacedOrder] = useState(null);

  if (!isLoggedIn || !user) return null;

  const { subtotal, deliveryCharge, discount, total } = getCartTotals();

  // If cart is empty and not on success step, redirect
  if (items.length === 0 && step !== 4) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <h2 className="font-playfair text-xl font-bold text-brand-ocean">Your cart is empty</h2>
        <Link to="/products" className="mt-6 inline-block bg-brand-primary text-brand-cream px-6 py-2 rounded-xl text-xs font-bold">
          Shop Products
        </Link>
      </div>
    );
  }

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!newAddress.fullName || !newAddress.phone || !newAddress.doorNo || !newAddress.street || !newAddress.city || !newAddress.pincode) {
      addToast('Please fill in all address fields.', 'warning');
      return;
    }
    
    addAddress(newAddress);
    addToast('New delivery address saved successfully!', 'success');
    setShowNewAddressForm(false);
    setNewAddress({
      fullName: '',
      phone: '',
      doorNo: '',
      street: '',
      city: '',
      pincode: '',
      state: 'Tamil Nadu'
    });
    // Auto select newly added address
    setTimeout(() => {
      const freshUser = useAuthStore.getState().user;
      const newestAddr = freshUser.addresses[freshUser.addresses.length - 1];
      if (newestAddr) setSelectedAddressId(newestAddr.id);
    }, 100);
  };

  const handlePlaceOrder = () => {
    const deliveryAddress = user.addresses.find(a => a.id === selectedAddressId);
    if (!deliveryAddress) {
      addToast('Please select a shipping address.', 'warning');
      setStep(1);
      return;
    }

    const orderData = {
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone,
      items: items.map(item => ({
        productId: item.productId,
        nameEn: item.nameEn,
        nameTa: item.nameTa,
        weight: item.weight,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      subtotal,
      deliveryCharge,
      discount,
      couponApplied: useCartStore.getState().appliedCoupon?.code || null,
      total,
      paymentMethod,
      address: {
        fullName: deliveryAddress.fullName,
        phone: deliveryAddress.phone,
        doorNo: deliveryAddress.doorNo,
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        pincode: deliveryAddress.pincode,
        state: deliveryAddress.state
      }
    };

    api.createOrder(orderData).then(newOrder => {
      setPlacedOrder(newOrder);
      clearCart();
      setStep(4);
      addToast('Traditional order placed successfully! 🎉', 'success');
    });
  };

  const selectedAddress = user.addresses.find(a => a.id === selectedAddressId);

  const stepHeaderClass = (curr) => `flex items-center gap-1.5 pb-2.5 font-bold font-space text-xs md:text-sm border-b-2 shrink-0 ${
    step === curr
      ? 'border-brand-primary text-brand-primary'
      : step > curr
      ? 'border-brand-ocean text-brand-ocean'
      : 'border-transparent text-brand-dark/35'
  }`;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-20 font-inter">
      <Breadcrumb items={[{ label: 'Checkout', link: '/checkout' }]} />

      {step !== 4 && (
        <h1 className="font-tiro-tamil text-2xl md:text-3xl text-brand-primary font-bold border-b border-brand-sand pb-4 mb-8">
          பணம் செலுத்துதல்
        </h1>
      )}

      {step === 4 ? (
        // SUCCESS STEP
        <div className="max-w-xl mx-auto bg-white border border-brand-sand rounded-3xl p-8 md:p-10 shadow-xl text-center border-b-8 border-b-brand-sand my-10 relative overflow-hidden">
          <div className="palm-leaf-pattern absolute inset-0 opacity-15 pointer-events-none" />
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full w-max mx-auto mb-6 border border-emerald-100 shadow-inner">
            <CheckCircle className="w-16 h-16 fill-current text-emerald-500 text-white" />
          </div>
          <h2 className="font-tiro-tamil text-2xl text-emerald-800 font-bold mb-2">உங்களது ஆர்டர் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!</h2>
          <h3 className="font-playfair text-xl font-bold text-brand-ocean">Traditional Order Placed!</h3>
          
          <div className="bg-brand-cream border border-brand-sand p-5 rounded-2xl my-6 space-y-2.5 font-space text-xs font-semibold max-w-sm mx-auto text-left shadow-sm">
            <div className="flex justify-between border-b border-brand-sand/50 pb-2">
              <span className="text-brand-dark/50">Order ID:</span>
              <span className="text-brand-primary font-bold tracking-wider font-mono">{placedOrder?.id}</span>
            </div>
            <div className="flex justify-between border-b border-brand-sand/50 pb-2">
              <span className="text-brand-dark/50">Payment Method:</span>
              <span>{placedOrder?.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-dark/50">Total Paid:</span>
              <span className="text-brand-primary font-bold">₹{placedOrder?.total.toFixed(2)}</span>
            </div>
          </div>

          <p className="text-xs text-brand-dark/65 leading-relaxed max-w-md mx-auto mb-8 font-medium">
            Thank you for shopping at <strong>Namma Oor Karuvattu Kadai</strong>! Your order is being processed by our coastal cooperative units. We have sent receipt details to your email.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center font-bold">
            <Link
              to="/my-orders"
              className="bg-brand-ocean text-brand-cream px-6 py-3 rounded-xl text-xs hover:bg-brand-primary transition-colors shadow"
            >
              Track Order History
            </Link>
            <Link
              to="/products"
              className="border border-brand-sand text-brand-dark hover:bg-brand-sand/20 px-6 py-3 rounded-xl text-xs transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      ) : (
        // CHECKOUT FLOW STEPS
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Checkout column (Left) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step Indicators Header */}
            <div className="flex border-b border-brand-sand gap-6 overflow-x-auto no-scrollbar pb-0.5 mb-2">
              <span className={stepHeaderClass(1)}>1. Shipping Address</span>
              <span className={stepHeaderClass(2)}>2. Payment Method</span>
              <span className={stepHeaderClass(3)}>3. Confirm Order</span>
            </div>

            {/* STEP 1: Address */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-brand-ocean">Select Delivery Address</h3>
                  {!showNewAddressForm && (
                    <button
                      onClick={() => setShowNewAddressForm(true)}
                      className="text-xs font-bold text-brand-primary hover:text-brand-secondary flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add New Address
                    </button>
                  )}
                </div>

                {showNewAddressForm ? (
                  // New Address Form
                  <form onSubmit={handleSaveAddress} className="bg-white border border-brand-sand rounded-2xl p-6 space-y-4 text-xs font-semibold shadow-sm">
                    <h4 className="text-xs font-bold text-brand-ocean border-b border-brand-sand pb-2 uppercase tracking-wider">New Shipping Details</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label>Consignee Full Name</label>
                        <input
                          type="text"
                          required
                          value={newAddress.fullName}
                          onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                          placeholder="e.g. Balaji Se"
                          className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder-brand-dark/30 font-medium"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label>Phone Number (Delivery Contact)</label>
                        <input
                          type="tel"
                          required
                          pattern="[0-9]{10}"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/g, '') })}
                          placeholder="10-digit number"
                          className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder-brand-dark/30 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5 sm:col-span-1">
                        <label>Door / House / Flat No.</label>
                        <input
                          type="text"
                          required
                          value={newAddress.doorNo}
                          onChange={(e) => setNewAddress({ ...newAddress, doorNo: e.target.value })}
                          placeholder="e.g. 14/3A"
                          className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder-brand-dark/30 font-medium"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label>Street / Locality Area</label>
                        <input
                          type="text"
                          required
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          placeholder="e.g. East Coast Road"
                          className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder-brand-dark/30 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label>City</label>
                        <input
                          type="text"
                          required
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          placeholder="e.g. Chennai"
                          className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder-brand-dark/30 font-medium"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label>Pincode / Zip Code</label>
                        <input
                          type="text"
                          required
                          pattern="[0-9]{6}"
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '') })}
                          placeholder="6-digit pincode"
                          className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary placeholder-brand-dark/30 font-medium"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label>State</label>
                        <select
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
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
                        onClick={() => setShowNewAddressForm(false)}
                        className="border border-brand-sand px-4 py-2.5 rounded-xl hover:bg-brand-sand/15 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-brand-primary text-brand-cream px-6 py-2.5 rounded-xl hover:bg-brand-secondary active:scale-95 transition-all shadow cursor-pointer"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                ) : user.addresses.length === 0 ? (
                  // Empty address warning
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center space-y-3">
                    <p className="font-bold text-sm">No delivery address saved yet!</p>
                    <p className="text-xs opacity-90 max-w-xs mx-auto">Please add a shipping address in order for our delivery service to calculate shipping routes.</p>
                    <button
                      onClick={() => setShowNewAddressForm(true)}
                      className="bg-brand-primary text-brand-cream text-xs font-bold px-4 py-2 rounded-xl"
                    >
                      Add Address Now
                    </button>
                  </div>
                ) : (
                  // List saved addresses
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`bg-white border p-4.5 rounded-2xl shadow-sm relative group flex items-start gap-3.5 cursor-pointer hover:border-brand-ocean/40 transition-all ${
                          selectedAddressId === addr.id
                            ? 'border-2 border-brand-ocean ring-2 ring-brand-ocean/10'
                            : 'border-brand-sand'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selected_address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="accent-brand-ocean w-4 h-4 mt-0.5 shrink-0"
                        />
                        <div className="text-xs text-brand-dark/80 font-medium">
                          <p className="font-bold text-brand-ocean flex items-center gap-1.5">
                            {addr.fullName} 
                            {addr.isDefault && <span className="bg-brand-sand text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Default</span>}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed">
                            {addr.doorNo}, {addr.street}, {addr.city} - {addr.pincode}, {addr.state}
                          </p>
                          <p className="mt-1.5 text-[10px] text-brand-dark/50">📞 Contact: {addr.phone}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAddress(addr.id);
                          }}
                          className="absolute bottom-2.5 right-2.5 p-1 bg-rose-50 text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Step actions */}
                {!showNewAddressForm && user.addresses.length > 0 && (
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!selectedAddressId}
                      className="bg-brand-primary text-brand-cream py-3 px-6 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-brand-secondary active:scale-95 transition-all shadow disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      Next: Payment Method <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-brand-ocean">Choose Payment Option</h3>

                <div className="bg-white border border-brand-sand rounded-2xl p-6 space-y-4 shadow-sm text-xs font-semibold">
                  {[
                    { id: 'UPI (GPay/PhonePe)', label: 'UPI (Google Pay / PhonePe / Paytm)', desc: 'Instant verification via UPI App redirection' },
                    { id: 'Card (Credit/Debit)', label: 'Credit or Debit Card', desc: 'Secure payment via Visa, Mastercard, or RuPay' },
                    { id: 'Net Banking', label: 'Net Banking', desc: 'Login directly to SBI, ICICI, HDFC, etc.' },
                    { id: 'Cash on Delivery (COD)', label: 'Cash on Delivery (COD) / Pay on Delivery', desc: 'Pay cash to delivery executive at your doorstep (₹50 COD charge might apply)' }
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer hover:border-brand-ocean/35 transition-all ${
                        paymentMethod === option.id
                          ? 'border-brand-ocean bg-brand-sand/5'
                          : 'border-brand-sand bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_option"
                        value={option.id}
                        checked={paymentMethod === option.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="accent-brand-ocean w-4.5 h-4.5 mt-0.5 shrink-0"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-brand-ocean">{option.label}</p>
                        <p className="text-[11px] text-brand-dark/55 mt-0.5 font-medium">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="pt-4 flex justify-between font-bold text-xs">
                  <button
                    onClick={() => setStep(1)}
                    className="border border-brand-sand px-6 py-3 rounded-xl hover:bg-brand-sand/15 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Address
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="bg-brand-primary text-brand-cream px-6 py-3 rounded-xl flex items-center gap-1.5 hover:bg-brand-secondary active:scale-95 transition-all shadow cursor-pointer"
                  >
                    Next: Review Order <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Confirm Review */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-brand-ocean">Review & Place Order</h3>

                {/* Split reviews info summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  {/* Selected Address Summary */}
                  <div className="bg-white border border-brand-sand p-4.5 rounded-2xl shadow-sm space-y-2">
                    <div className="flex justify-between items-center border-b border-brand-sand pb-2">
                      <p className="font-bold text-brand-ocean flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-primary" /> Shipping Address</p>
                      <button onClick={() => setStep(1)} className="text-[10px] text-brand-primary hover:underline font-bold">Edit</button>
                    </div>
                    {selectedAddress && (
                      <div className="text-brand-dark/75 font-medium">
                        <p className="font-bold text-brand-dark">{selectedAddress.fullName}</p>
                        <p className="text-[11px] mt-0.5">{selectedAddress.doorNo}, {selectedAddress.street}, {selectedAddress.city} - {selectedAddress.pincode}</p>
                        <p className="text-[10px] mt-1 text-brand-dark/45">Phone: {selectedAddress.phone}</p>
                      </div>
                    )}
                  </div>

                  {/* Selected Payment Summary */}
                  <div className="bg-white border border-brand-sand p-4.5 rounded-2xl shadow-sm space-y-2">
                    <div className="flex justify-between items-center border-b border-brand-sand pb-2">
                      <p className="font-bold text-brand-ocean flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-brand-primary" /> Payment Method</p>
                      <button onClick={() => setStep(2)} className="text-[10px] text-brand-primary hover:underline font-bold">Edit</button>
                    </div>
                    <div className="text-brand-dark/75 font-medium">
                      <p className="font-bold text-brand-dark">{paymentMethod}</p>
                      <p className="text-[11px] mt-0.5">Sourced & processed instantly after confirmation.</p>
                    </div>
                  </div>
                </div>

                {/* Items strip details */}
                <div className="bg-white border border-brand-sand rounded-2xl p-4.5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-brand-ocean uppercase tracking-wider border-b border-brand-sand pb-2 flex items-center gap-2">
                    <ShoppingBag className="w-4.5 h-4.5 text-brand-primary" /> Items in Order ({items.length})
                  </h4>

                  <div className="divide-y divide-brand-sand/50">
                    {items.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-brand-sand shrink-0">
                            <img src={item.image} alt={item.nameEn} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-tiro-tamil text-brand-primary font-bold">{item.nameTa}</p>
                            <p className="text-[11px] font-playfair font-bold text-brand-dark/70">{item.nameEn} ({item.weight})</p>
                          </div>
                        </div>
                        <div className="font-space text-right shrink-0">
                          <span className="text-brand-dark/50 font-normal mr-2">{item.quantity} x ₹{item.price}</span>
                          <span className="text-brand-ocean font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-between font-bold text-xs">
                  <button
                    onClick={() => setStep(2)}
                    className="border border-brand-sand px-6 py-3 rounded-xl hover:bg-brand-sand/15 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Payment
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    className="bg-brand-primary text-brand-cream px-8 py-3.5 rounded-xl hover:bg-brand-secondary active:scale-95 transition-all shadow-md text-sm cursor-pointer flex items-center gap-2"
                  >
                    Place Traditional Order <ArrowRight className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Checkout Totals Summary sidebar (Right - col-span-4) */}
          <div className="lg:col-span-4 sticky top-24 self-start">
            <div className="bg-brand-cream/50 border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-playfair text-base font-bold text-brand-ocean border-b border-brand-sand pb-3">
                Order Value
              </h3>

              <div className="space-y-3.5 text-xs font-semibold">
                <div className="flex justify-between text-brand-dark/70">
                  <span>Cart Items Subtotal</span>
                  <span className="font-space font-bold">₹{subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon Discount</span>
                    <span className="font-space font-bold">- ₹{discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-brand-dark/70">
                  <span>Estimated Delivery</span>
                  <span className="font-space font-bold">
                    {deliveryCharge === 0 ? (
                      <span className="text-emerald-700 uppercase font-bold text-[10px]">Free</span>
                    ) : (
                      `₹${deliveryCharge.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="border-t border-brand-sand pt-4.5 flex justify-between text-sm font-bold text-brand-ocean">
                  <span>Total Payable</span>
                  <span className="font-space text-lg text-brand-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Security banner */}
            <div className="mt-4 border border-brand-sand/55 p-3 rounded-2xl flex items-center gap-2.5 text-[10.5px] font-semibold text-brand-dark/65 bg-white">
              <ShieldCheck className="w-5.5 h-5.5 text-emerald-600 shrink-0" />
              <span>SSL Sourced Secure Checkout. Your order payments are handled with bank-level encryption algorithms.</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
