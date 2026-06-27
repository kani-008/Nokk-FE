import { useState, useEffect }   from "react";
import { useNavigate, Link }     from "react-router-dom";
import { ArrowLeft }             from "lucide-react";
import { useAddresses, useAddAddress } from "../hooks/queries/useProfile";
import { useCheckout } from "../hooks/queries/useOrders";
import API from "../ApiCall/Api.jsx";
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
  // ── address state ──────────────────────────────────────────────────
  const { data: addressesList = [], isLoading: addressesLoading } = useAddresses();
  const savedAddresses = addressesList;

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
  const [orderErr, setOrderErr] = useState("");
  const [placedOrderId, setPlacedOrderId] = useState(null);

  useEffect(() => {
    if (addressesList.length > 0) {
      setSelectedSaved(addressesList[0]);
      setShowNewForm(false);
    } else {
      setShowNewForm(true);
    }
  }, [addressesList]);

  // ── redirect if cart emptied ───────────────────────────────────────
  useEffect(() => {
    if (items.length === 0) navigate("/cart");
  }, [items, navigate]);

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

  const checkoutMutation = useCheckout();
  const addAddressMutation = useAddAddress();
  const placing = checkoutMutation.isPending || addAddressMutation.isPending;

  const handlePlaceOrder = async () => {
    setOrderErr("");
    try {
      const address = showNewForm ? newAddress : selectedSaved;

      // Save new address to backend if logged in
      if (token && showNewForm) {
        try {
          await addAddressMutation.mutateAsync({
            label: "Home",
            fullName: newAddress.name,
            phone: newAddress.phone,
            addressLine1: newAddress.addressLine1,
            addressLine2: newAddress.addressLine2 || "",
            city: newAddress.city,
            state: newAddress.state,
            pincode: newAddress.pincode,
            isDefault: false
          });
        } catch (saveAddrErr) {
          console.error("Failed to auto-save new address to profile:", saveAddrErr);
          throw new Error(saveAddrErr.response?.data?.message || saveAddrErr.message || "Failed to save address to profile");
        }
      }
      const payload = {
        items: items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          weight: i.weight,
          price: i.price,
          quantity: i.quantity,
          nameEn: i.productName,
          nameTa: i.nameTa
        })),
        address: {
          fullName: address.name,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || "",
          city: address.city,
          state: address.state,
          pincode: address.pincode
        },
        paymentMethod: payMethod,
        couponApplied: coupon?.code || null,
        subtotal: sub,
        deliveryCharge: ship,
        discount: disc,
        total: tot
      };

      const res = await checkoutMutation.mutateAsync(payload);

      // Make API call inline to clear cart on server if logged in
      if (token) {
        try {
          await API.delete("/cart/clear-cart");
        } catch (clearErr) {
          console.error("Failed to clear server cart:", clearErr);
        }
      }
      useCartStore.getState().clearCartLocal();

      setPlacedOrderId(res.order?.id);
      if (payMethod !== "upi" || import.meta.env.DEV) {
        navigate("/my-orders", { state: { newOrderId: res.order?.id } });
      }
    } catch (err) {
      setOrderErr(err.response?.data?.message || err.message || "Failed to place order. Please try again.");
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