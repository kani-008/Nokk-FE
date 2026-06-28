import { useState, useEffect }   from "react";
import { useNavigate, Link }     from "react-router-dom";
import { ArrowLeft }             from "lucide-react";
import { useAddresses, useAddAddress } from "../hooks/queries/useProfile";
import { useDeliverySettings } from "../hooks/queries/useHome";
import { useCheckout, useCreateRazorpayOrder, useVerifyRazorpayPayment } from "../hooks/queries/useOrders";
import { useRazorpayScript } from "../hooks/useRazorpayScript";
import API from "../ApiCall/Api.jsx";
import { useCartStore }          from "../components/store/CartStore";
import { useAuthStore }          from "../components/store/AuthStore";
import { useBuyNowStore }        from "../components/store/BuyNowStore";
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
  const { items, coupon, subtotal, discount } = useCartStore();
  const buyNowItem  = useBuyNowStore((s) => s.item);
  const clearBuyNow = useBuyNowStore((s) => s.clearItem);

  const checkoutItems = buyNowItem ? [buyNowItem] : items;

  // delivery config from backend settings (falls back to DB values while loading)
  const { data: deliverySettings } = useDeliverySettings();
  const freeShippingThreshold = deliverySettings?.freeShippingThreshold ?? 500;
  const flatDeliveryCharge    = deliverySettings?.flatDeliveryCharge    ?? 50;

  // computed totals
  const sub  = buyNowItem ? buyNowItem.price * buyNowItem.quantity : subtotal();
  const disc = buyNowItem ? 0 : discount();
  const ship = sub >= freeShippingThreshold ? 0 : flatDeliveryCharge;
  const tot  = sub - disc + ship;

  // ── step ───────────────────────────────────────────────────────────
  const [step, setStep] = useState("address");

  // ── address state ──────────────────────────────────────────────────
  // ── address state ──────────────────────────────────────────────────
  const { data: addressesList = [] } = useAddresses();
  const savedAddresses = addressesList;

  const [selectedSaved,  setSelectedSaved]  = useState(null);
  const [showNewForm,    setShowNewForm]     = useState(false);
  const [newAddress,     setNewAddress]      = useState({
    name:         user?.fullName || user?.name || "",
    phone:        user?.phone   || "",
    addressLine1: "",
    addressLine2: "",
    taluk:        "",
    city:         "",
    state:        "",
    pincode:      "",
  });
  const [addrErrors, setAddrErrors] = useState({});

  // ── payment state ──────────────────────────────────────────────────
  const [payMethod, setPayMethod] = useState("razorpay");
  const [customerUpiId, setCustomerUpiId] = useState("");
  const [paymentMsg, setPaymentMsg] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // ── order submit ───────────────────────────────────────────────────
  const [orderErr, setOrderErr] = useState("");
  const [placedOrderId, setPlacedOrderId] = useState(null);

  const rzpReady = useRazorpayScript();
  const createRpOrderMutation = useCreateRazorpayOrder();
  const verifyRpPaymentMutation = useVerifyRazorpayPayment();

  const handleSelectPaymentMethod = (m) => {
    setPayMethod(m);
    setPaymentMsg("");
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (addressesList.length > 0) {
        setSelectedSaved(addressesList[0]);
        setShowNewForm(false);
      } else {
        setShowNewForm(true);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [addressesList]);

  // ── redirect if cart emptied (skip when in buy-now mode) ──────────
  useEffect(() => {
    if (!buyNowItem && items.length === 0) navigate("/cart");
  }, [buyNowItem, items, navigate]);

  // ── clear buy-now item when leaving checkout ───────────────────────
  useEffect(() => {
    return () => {
      if (window.location.pathname !== "/checkout") {
        clearBuyNow();
      }
    };
  }, [clearBuyNow]);

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

  const handleSavedEdited = (updated) => {
    setSelectedSaved(updated);
  };

  const checkoutMutation = useCheckout();
  const addAddressMutation = useAddAddress();
  const placing =
    checkoutMutation.isPending ||
    addAddressMutation.isPending ||
    createRpOrderMutation.isPending ||
    verifyRpPaymentMutation.isPending ||
    verifyingPayment ||
    (payMethod === "razorpay" && !rzpReady);

  const handlePlaceOrder = async () => {
    setOrderErr("");
    try {
      const address = showNewForm ? newAddress : selectedSaved;

      // Save new address to backend if logged in
      if (token && showNewForm) {
        try {
          await addAddressMutation.mutateAsync({
            label:        "Home",
            fullName:     newAddress.name,
            phone:        newAddress.phone,
            addressLine1: newAddress.addressLine1,
            addressLine2: newAddress.addressLine2 || "",
            taluk:        newAddress.taluk || "",
            city:         newAddress.city,
            state:        newAddress.state,
            pincode:      newAddress.pincode,
            isDefault:    false,
          });
        } catch (saveAddrErr) {
          console.error("Failed to auto-save new address to profile:", saveAddrErr);
          throw new Error(saveAddrErr.response?.data?.message || saveAddrErr.message || "Failed to save address to profile", { cause: saveAddrErr });
        }
      }
      const payload = {
        items: checkoutItems.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          weight: i.weight,
          price: i.price,
          quantity: i.quantity,
          nameEn: i.productName,
          nameTa: i.nameTa
        })),
        address: {
          fullName:     address.name,
          phone:        address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || "",
          taluk:        address.taluk || "",
          city:         address.city,
          state:        address.state,
          pincode:      address.pincode,
        },
        paymentMethod: payMethod,
        couponApplied: coupon?.code || null,
        subtotal: sub,
        deliveryCharge: ship,
        discount: disc,
        total: tot
      };

      if (payMethod === "razorpay") {
        console.log("[Razorpay Frontend] Initiating Razorpay order creation on backend. Payload:", {
          itemsCount: payload.items?.length,
          address: payload.address,
          couponApplied: payload.couponApplied,
        });
        const resCreate = await createRpOrderMutation.mutateAsync({
          items: payload.items,
          address: payload.address,
          couponApplied: payload.couponApplied,
        });

        console.log("[Razorpay Frontend] Backend order creation successful. Razorpay Order Details:", resCreate);

        const options = {
          key: resCreate.keyId,
          amount: Math.round(resCreate.amount * 100),
          currency: resCreate.currency || "INR",
          name: "Namma Oor Karuvattu Kadai",
          description: "Order Checkout",
          order_id: resCreate.razorpayOrderId,
          handler: async function (response) {
            console.log("[Razorpay Frontend] Payment succeeded inside Razorpay modal. Response received:", response);
            setVerifyingPayment(true);
            try {
              const verifyPayload = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                items: payload.items,
                address: payload.address,
                couponApplied: payload.couponApplied,
              };
              console.log("[Razorpay Frontend] Sending payment verification payload to backend:", verifyPayload);
              const resVerify = await verifyRpPaymentMutation.mutateAsync(verifyPayload);

              console.log("[Razorpay Frontend] Payment verified successfully by backend. Order details:", resVerify);

              if (!buyNowItem) {
                if (token) {
                  try {
                    console.log("[Razorpay Frontend] Clearing server cart...");
                    await API.delete("/cart/clear-cart");
                  } catch (clearErr) {
                    console.error("[Razorpay Frontend] Failed to clear server cart:", clearErr);
                  }
                }
                useCartStore.getState().clearCartLocal();
              }
              clearBuyNow();

              setPlacedOrderId(resVerify.order?.id);
            } catch (verifyErr) {
              console.error("[Razorpay Frontend] Payment verification failed:", verifyErr);
              setOrderErr(
                `Payment verified with signature mismatch or database processing error. If money was deducted, please contact support with Payment ID: ${response.razorpay_payment_id}. Error: ${
                  verifyErr.response?.data?.message || verifyErr.message
                }`
              );
            } finally {
              setVerifyingPayment(false);
            }
          },
          modal: {
            ondismiss: function () {
              console.log("[Razorpay Frontend] Razorpay checkout modal was dismissed by the user.");
              setPaymentMsg("Payment cancelled. You can select a payment method and try again.");
              setStep("payment");
            }
          },
          prefill: {
            name: payload.address.fullName,
            contact: payload.address.phone,
            email: user?.email || "",
          },
          theme: {
            color: "#78350f",
          }
        };

        console.log("[Razorpay Frontend] Initializing Razorpay widget with options:", options);
        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      const res = await checkoutMutation.mutateAsync(payload);

      // Only clear the real cart when not in buy-now mode
      if (!buyNowItem) {
        if (token) {
          try {
            await API.delete("/cart/clear-cart");
          } catch (clearErr) {
            console.error("Failed to clear server cart:", clearErr);
          }
        }
        useCartStore.getState().clearCartLocal();
      }
      clearBuyNow();

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
              onSavedEdited={handleSavedEdited}
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
              onSelect={handleSelectPaymentMethod}
              onBack={() => setStep("address")}
              onNext={() => setStep("review")}
              amount={tot}
              customerUpiId={customerUpiId}
              onCustomerUpiIdChange={setCustomerUpiId}
              infoMessage={paymentMsg}
            />
          )}

          {step === "review" && (
            <>
              <ReviewStep
                address={activeAddress}
                payMethod={payMethod}
                items={checkoutItems}
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
            items={checkoutItems}
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