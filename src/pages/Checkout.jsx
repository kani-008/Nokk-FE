import { useState, useEffect }   from "react";
import { useNavigate, Link }     from "react-router-dom";
import { ArrowLeft }             from "lucide-react";
import comboImg from "../assets/products/combo.jpg";
import { apiFetch } from "../ApiCall/Api.jsx";

const userApi = {
  addresses: () =>
    apiFetch(`/users/me/addresses`),
};

const orderApi = {
  place: async (data) => {
    const payload = {
      items: data.items.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        weight: i.weight,
        price: i.price,
        quantity: i.quantity,
        nameEn: i.productName,
        nameTa: i.nameTa
      })),
      address: {
        fullName: data.shippingAddress.name,
        phone: data.shippingAddress.phone,
        addressLine1: data.shippingAddress.addressLine1,
        addressLine2: data.shippingAddress.addressLine2,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        pincode: data.shippingAddress.pincode
      },
      paymentMethod: data.paymentMethod,
      couponApplied: data.couponCode || null,
      subtotal: data.subtotal,
      deliveryCharge: data.deliveryCharge,
      discount: data.discount,
      total: data.total
    };

    const res = await apiFetch(`/orders/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return res;
  }
};
import { useCartStore }          from "../components/store/CartStore";
import { useAuthStore }          from "../components/store/AuthStore";
import StepBar      from "../components/checkout/StepBar";
import AddressStep  from "../components/checkout/Address";
import PaymentStep  from "../components/checkout/Payment";
import ReviewStep   from "../components/checkout/Review";
import OrderSummary from "../components/checkout/OrderSummary";

// ── Address validation ─────────────────────────────────────────────────
function validateAddress(addr) {
  const e = {};
  if (!addr.name?.trim())                              e.name         = "Required";
  if (!/^[6-9]\d{9}$/.test(addr.phone?.trim()))       e.phone        = "Enter valid 10-digit number";
  if (!addr.addressLine1?.trim())                      e.addressLine1 = "Required";
  if (!addr.city?.trim())                              e.city         = "Required";
  if (!addr.state?.trim())                             e.state        = "Required";
  if (!/^\d{6}$/.test(addr.pincode?.trim()))           e.pincode      = "Enter valid 6-digit pincode";
  return e;
}

// ══════════════════════════════════════════════════════════════════════
// CHECKOUT PAGE — state owner only, no JSX layout logic
// ══════════════════════════════════════════════════════════════════════
export default function Checkout() {
  const navigate               = useNavigate();
  const { token, user }        = useAuthStore();
  const { items, coupon, subtotal, discount, shipping, total, clearCart } = useCartStore();

  // computed totals
  const sub  = subtotal();
  const disc = discount();
  const ship = shipping();
  const tot  = total();

  // ── step ───────────────────────────────────────────────────────────
  const [step, setStep] = useState("address");

  // ── address state ──────────────────────────────────────────────────
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSaved,  setSelectedSaved]  = useState(null);
  const [showNewForm,    setShowNewForm]     = useState(false);
  const [newAddress,     setNewAddress]      = useState({
    name:         user?.fullName || user?.name || "",
    phone:        user?.phone   || "",
    addressLine1: "",
    addressLine2: "",
    city:         "",
    state:        "",
    pincode:      "",
  });
  const [addrErrors, setAddrErrors] = useState({});

  // ── payment state ──────────────────────────────────────────────────
  const [payMethod, setPayMethod] = useState("upi");
  const [customerUpiId, setCustomerUpiId] = useState("");

  // ── order submit ───────────────────────────────────────────────────
  const [placing,  setPlacing]  = useState(false);
  const [orderErr, setOrderErr] = useState("");
  const [placedOrderId, setPlacedOrderId] = useState(null);

  // ── load saved addresses on mount ─────────────────────────────────
  useEffect(() => {
    if (!token) return;
    userApi.addresses()
      .then((r) => {
        const list = (r.addresses || []).map((addr) => ({
          id: addr.id,
          label: addr.label,
          name: addr.full_name,
          phone: addr.phone,
          addressLine1: addr.address_line1,
          addressLine2: addr.address_line2,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          isDefault: addr.is_default
        }));
        setSavedAddresses(list);
        if (list.length > 0) {
          setSelectedSaved(list[0]);
          setShowNewForm(false);
        } else {
          setShowNewForm(true);
        }
      })
      .catch(() => setShowNewForm(true));
  }, [token]);

  // ── redirect if cart emptied ───────────────────────────────────────
  useEffect(() => {
    if (items.length === 0) navigate("/cart");
  }, [items]);

  // ── handlers ──────────────────────────────────────────────────────
  const handleAddressNext = () => {
    if (!showNewForm && selectedSaved) { setStep("payment"); return; }
    const errs = validateAddress(newAddress);
    if (Object.keys(errs).length) { setAddrErrors(errs); return; }
    setAddrErrors({});
    setStep("payment");
  };

  const handleChangeNew = (key, value) => {
    setNewAddress((a) => ({ ...a, [key]: value }));
    setAddrErrors((e) => ({ ...e, [key]: "" }));
  };

  const handleSelectSaved = (addr) => {
    setSelectedSaved(addr);
    setShowNewForm(false);
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setOrderErr("");
    try {
      const address = showNewForm ? newAddress : selectedSaved;
      const res = await orderApi.place({
        items: items.map((i) => ({
          variantId: i.variantId,
          productId: i.productId,
          productName: i.productName,
          nameTa: i.nameTa,
          weight: i.weight,
          price: i.price,
          quantity:  i.quantity,
        })),
        shippingAddress: {
          name:         address.name,
          phone:        address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || "",
          city:         address.city,
          state:        address.state,
          pincode:      address.pincode,
        },
        paymentMethod:  payMethod,
        couponCode:     coupon?.code || undefined,
        customerUpiId:  customerUpiId || undefined,
        subtotal:       sub,
        deliveryCharge: ship,
        discount:       disc,
        total:          tot,
      }, token);

      await clearCart();

      navigate("/my-orders", { state: { newOrderId: res.order?.id } });
    } catch (err) {
      setOrderErr(err.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const activeAddress = showNewForm ? newAddress : selectedSaved;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* back to cart */}
      <Link
        to="/cart"
        className="inline-flex items-center gap-1.5 font-body text-sm text-amber-500 hover:text-brand-700 mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Cart
      </Link>

      <h1 className="font-display text-2xl font-bold text-brand-900 mb-6">Checkout</h1>

      {/* step bar */}
      <StepBar current={step} />

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Step panels ───────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {step === "address" && (
            <AddressStep
              savedAddresses={savedAddresses}
              selectedSaved={selectedSaved}
              onSelectSaved={handleSelectSaved}
              showNewForm={showNewForm}
              onToggleNewForm={() => setShowNewForm((s) => !s)}
              newAddress={newAddress}
              onChangeNew={handleChangeNew}
              errors={addrErrors}
              onNext={handleAddressNext}
            />
          )}

          {step === "payment" && (
            <PaymentStep
              selected={payMethod}
              onSelect={setPayMethod}
              onBack={() => setStep("address")}
              onNext={() => setStep("review")}
              amount={tot}
              customerUpiId={customerUpiId}
              onCustomerUpiIdChange={setCustomerUpiId}
            />
          )}

          {step === "review" && (
            <>
              <ReviewStep
                address={activeAddress}
                payMethod={payMethod}
                items={items}
                total={tot}
                placing={placing}
                error={orderErr}
                placedOrderId={placedOrderId}
                token={token}
                onBack={() => setStep("payment")}
                onChangeAddress={() => setStep("address")}
                onChangePayment={() => setStep("payment")}
                onPlaceOrder={handlePlaceOrder}
              />

              {placedOrderId && (
                <button
                  onClick={() => navigate("/my-orders", { state: { newOrderId: placedOrderId } })}
                  className="btn-lg btn-primary w-full mt-4"
                >
                  View My Orders
                </button>
              )}
            </>
          )}

        </div>

        {/* ── Sticky order summary sidebar ──────────────────────── */}
        <div className="lg:w-72 shrink-0">
          <OrderSummary
            items={items}
            sub={sub}
            disc={disc}
            ship={ship}
            tot={tot}
            coupon={coupon}
          />
        </div>

      </div>
    </div>
  );
}