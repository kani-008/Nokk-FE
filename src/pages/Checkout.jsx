import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAddresses, useAddAddress } from "../hookqueries/useProfile";
import { useDeliverySettings } from "../hookqueries/useHome";
import { usePublicSettings } from "../hookqueries/useSettings";
import {
  useCheckout,
  useCreateRazorpayOrder,
  useVerifyRazorpayPayment,
} from "../hookqueries/useOrders";
import { useRazorpayScript } from "../hookqueries/useRazorpayScript";
import API from "../ApiCall/Api.jsx";
import { useCartStore } from "../components/store/CartStore";
import { useAuthStore } from "../components/store/AuthStore";
import { useBuyNowStore } from "../components/store/BuyNowStore";
import StepBar from "../components/checkout/StepBar";
import AddressStep from "../components/checkout/Address";
import PaymentStep from "../components/checkout/Payment";
import OrderSummaryStep from "../components/checkout/OrderSummary";
import AddressPickerSheet from "../components/checkout/AddressPickerSheet";
import SEO from "../components/seo/SEO.jsx";

const mapServerItems = (raw = []) =>
  raw.map((i) => ({
    itemId: i.itemId,
    variantId: i.variantId,
    productId: i.productId,
    productName: i.nameEn ?? i.name,
    nameTa: i.nameTa,
    image: i.primaryImage,
    price: i.price,
    comparePrice: i.comparePrice,
    weight: i.weightLabel,
    quantity: i.quantity,
    slug: i.slug,
    inStock: i.inStock,
  }));

// ── Address validation ─────────────────────────────────────────────────
function validateAddress(addr) {
  const e = {};
  if (!addr.name?.trim()) e.name = "Required";
  if (!/^[6-9]\d{9}$/.test(addr.phone?.trim()))
    e.phone = "Enter valid 10-digit number";
  if (!addr.addressLine1?.trim()) e.addressLine1 = "Required";
  if (!addr.city?.trim()) e.city = "Required";
  if (!addr.state?.trim()) e.state = "Required";
  if (!/^\d{6}$/.test(addr.pincode?.trim()))
    e.pincode = "Enter valid 6-digit pincode";
  return e;
}

// ══════════════════════════════════════════════════════════════════════
// CHECKOUT PAGE — state owner only, no JSX layout logic
// ══════════════════════════════════════════════════════════════════════
export default function Checkout() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { items, coupon, subtotal, discount } = useCartStore();
  const buyNowItem = useBuyNowStore((s) => s.item);
  const clearBuyNow = useBuyNowStore((s) => s.clearItem);

  const checkoutItems = buyNowItem ? [buyNowItem] : items;

  // delivery config from backend settings (falls back to DB values while loading)
  const { data: deliverySettings } = useDeliverySettings();
  const { data: publicSettings = {} } = usePublicSettings();
  const freeShippingThreshold = deliverySettings?.freeShippingThreshold ?? 499;
  const flatDeliveryCharge    = deliverySettings?.flatDeliveryCharge    ?? 60;
  const minOrderValue         = deliverySettings?.minOrderValue         ?? 0;

  // computed totals
  const sub = buyNowItem ? buyNowItem.price * buyNowItem.quantity : subtotal();
  const disc = buyNowItem ? 0 : discount();
  const ship = sub >= freeShippingThreshold ? 0 : flatDeliveryCharge;
  const tot = sub - disc + ship;

  const totalMrp = checkoutItems.reduce((sum, item) => {
    const mrp = item.comparePrice ? Number(item.comparePrice) : Number(item.price);
    return sum + mrp * item.quantity;
  }, 0);

  // ── step ───────────────────────────────────────────────────────────
  const { stepParam } = useParams();
  const step = stepParam || "address"; // default step
  const [stepInitialized, setStepInitialized] = useState(false);

  // ── address picker sheet ───────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false);

  // ── address state ──────────────────────────────────────────────────
  const { data: addressesList = [], isLoading: addrLoading } = useAddresses();
  const savedAddresses = addressesList;

  const [selectedSaved, setSelectedSaved] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: user?.fullName || user?.name || "",
    phone: user?.phone || "",
    addressLine1: "",
    addressLine2: "",
    taluk: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [addrErrors, setAddrErrors] = useState({});

  // ── payment state ──────────────────────────────────────────────────
  const [payMethod, setPayMethod] = useState("razorpay_upi");
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

  // Ensure default saved address is selected when list loads
  useEffect(() => {
    if (!addrLoading && addressesList.length > 0 && !selectedSaved) {
      setSelectedSaved(addressesList[0]);
    }
  }, [addressesList, addrLoading, selectedSaved]);

  // ── Smart entry: once addresses finish loading, set initial step ───
  useEffect(() => {
    if (addrLoading || stepInitialized) return;
    const t = setTimeout(() => {
      if (stepParam === "address" || stepParam === "summary" || stepParam === "payment") {
        setStepInitialized(true);
        return;
      }
      if (addressesList.length > 0) {
        setSelectedSaved(addressesList[0]);
        setShowNewForm(false);
        navigate("/checkout/summary", { replace: true });
      } else {
        setShowNewForm(true);
        navigate("/checkout/address", { replace: true });
      }
      setStepInitialized(true);
    }, 0);
    return () => clearTimeout(t);
  }, [addressesList, addrLoading, stepInitialized, stepParam, navigate]);

  // ── redirect if cart emptied (skip when in buy-now mode) ──────────
  useEffect(() => {
    if (!buyNowItem && items.length === 0) navigate("/cart");
  }, [buyNowItem, items, navigate]);

  // ── clear buy-now item when leaving checkout ───────────────────────
  useEffect(() => {
    return () => {
      if (!window.location.pathname.startsWith("/checkout")) {
        clearBuyNow();
      }
    };
  }, [clearBuyNow]);

  // ── handlers ──────────────────────────────────────────────────────
  // Called by the "Save Address" button inside the new-address form.
  // Validates, promotes to selectedSaved, and collapses the form.
  const handleSaveNew = async () => {
    const errs = validateAddress(newAddress);
    if (Object.keys(errs).length) {
      setAddrErrors(errs);
      return;
    }
    setAddrErrors({});

    try {
      let finalAddress = newAddress;

      if (token) {
        const res = await addAddressMutation.mutateAsync({
          label: "Home",
          fullName: newAddress.name,
          phone: newAddress.phone,
          addressLine1: newAddress.addressLine1,
          addressLine2: newAddress.addressLine2 || "",
          taluk: newAddress.taluk || "",
          city: newAddress.city,
          state: newAddress.state,
          pincode: newAddress.pincode,
          isDefault: false,
        });

        if (res?.address) {
          finalAddress = {
            id: res.address.id,
            name: res.address.full_name,
            phone: res.address.phone,
            addressLine1: res.address.address_line1,
            addressLine2: res.address.address_line2 || "",
            taluk: res.address.taluk || "",
            city: res.address.city,
            state: res.address.state,
            pincode: res.address.pincode,
            label: res.address.label,
            isDefault: res.address.is_default,
          };
        }
      }

      setSelectedSaved(finalAddress);
      setShowNewForm(false);
      navigate("/checkout/summary", { replace: true });
    } catch (saveAddrErr) {
      console.error("Failed to save new address to profile:", saveAddrErr);
      setAddrErrors({
        submit: saveAddrErr.response?.data?.message || saveAddrErr.message || "Failed to save address to profile."
      });
    }
  };

  // Called by the sticky Continue button — only navigates when an address is confirmed.
  const handleAddressNext = () => {
    if (!selectedSaved) return;
    if (minOrderValue > 0 && sub < minOrderValue) {
      setOrderErr(`Minimum order value of ₹${minOrderValue} required. Add ₹${minOrderValue - sub} more to your cart.`);
      return;
    }
    setOrderErr("");
    navigate("/checkout/summary", { replace: true });
  };

  const handleChangeNew = (key, value) => {
    setNewAddress((a) => ({ ...a, [key]: value }));
    setAddrErrors((e) => ({ ...e, [key]: "" }));
    if (selectedSaved) {
      setSelectedSaved(null);
    }
  };

  const handleSelectSaved = (addr) => {
    setSelectedSaved(addr);
    setShowNewForm(false);
  };

  const handleSavedEdited = (updated) => {
    setSelectedSaved(updated);
  };

  const handleUpdateQty = async (variantId, newQty) => {
    const targetQty = Math.min(3, Math.max(1, newQty));
    if (buyNowItem && buyNowItem.variantId === variantId) {
      useBuyNowStore.getState().setItem({ ...buyNowItem, quantity: targetQty });
    } else {
      useCartStore.getState().updateQtyLocal(variantId, targetQty);
      if (token) {
        const item = useCartStore
          .getState()
          .items.find((i) => i.variantId === variantId);
        if (item?.itemId) {
          try {
            const res = await API.put("/cart/update-item", {
              itemId: item.itemId,
              quantity: targetQty,
            });
            useCartStore
              .getState()
              .setItems(mapServerItems(res.data.cart?.items));
          } catch {
            try {
              const res = await API.get("/cart/get-cart");
              useCartStore
                .getState()
                .setItems(mapServerItems(res.data.cart?.items));
            } catch {
              /* silent */
            }
          }
        }
      }
    }
  };

  const checkoutMutation = useCheckout();
  const addAddressMutation = useAddAddress();
  const placing =
    checkoutMutation.isPending ||
    addAddressMutation.isPending ||
    createRpOrderMutation.isPending ||
    verifyRpPaymentMutation.isPending ||
    verifyingPayment ||
    ((payMethod === "razorpay" || payMethod === "razorpay_upi") && !rzpReady);

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
            taluk: newAddress.taluk || "",
            city: newAddress.city,
            state: newAddress.state,
            pincode: newAddress.pincode,
            isDefault: false,
          });
        } catch (saveAddrErr) {
          console.error(
            "Failed to auto-save new address to profile:",
            saveAddrErr,
          );
          throw new Error(
            saveAddrErr.response?.data?.message ||
            saveAddrErr.message ||
            "Failed to save address to profile",
            { cause: saveAddrErr },
          );
        }
      }
      const payload = {
        items: checkoutItems.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          weight: i.weight,
          price: i.price,
          quantity: i.quantity,
          nameEn: i.productName,
          nameTa: i.nameTa,
        })),
        address: {
          fullName: address.name,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || "",
          taluk: address.taluk || "",
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        paymentMethod:
          payMethod === "razorpay_upi" || payMethod === "razorpay"
            ? "razorpay"
            : payMethod,
        couponApplied: coupon?.code || null,
        subtotal: sub,
        deliveryCharge: ship,
        discount: disc,
        total: tot,
      };

      if (payMethod === "razorpay" || payMethod === "razorpay_upi") {
        console.log(
          "[Razorpay Frontend] Initiating Razorpay order creation on backend. Payload:",
          {
            itemsCount: payload.items?.length,
            address: payload.address,
            couponApplied: payload.couponApplied,
          },
        );
        const resCreate = await createRpOrderMutation.mutateAsync({
          items: payload.items,
          address: payload.address,
          couponApplied: payload.couponApplied,
        });

        console.log(
          "[Razorpay Frontend] Backend order creation successful. Razorpay Order Details:",
          resCreate,
        );

        const options = {
          key: resCreate.keyId,
          amount: Math.round(resCreate.amount * 100),
          currency: resCreate.currency || "INR",
          name: "Namma Oor Karuvattu Kadai",
          description: "Order Checkout",
          order_id: resCreate.razorpayOrderId,
          handler: async function (response) {
            console.log(
              "[Razorpay Frontend] Payment succeeded inside Razorpay modal. Response received:",
              response,
            );
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
              console.log(
                "[Razorpay Frontend] Sending payment verification payload to backend:",
                verifyPayload,
              );
              const resVerify =
                await verifyRpPaymentMutation.mutateAsync(verifyPayload);

              console.log(
                "[Razorpay Frontend] Payment verified successfully by backend. Order details:",
                resVerify,
              );

              if (!buyNowItem) {
                if (token) {
                  try {
                    console.log("[Razorpay Frontend] Clearing server cart...");
                    await API.delete("/cart/clear-cart");
                  } catch (clearErr) {
                    console.error(
                      "[Razorpay Frontend] Failed to clear server cart:",
                      clearErr,
                    );
                  }
                }
                useCartStore.getState().clearCartLocal();
              }
              clearBuyNow();

              setPlacedOrderId(resVerify.order?.id);
            } catch (verifyErr) {
              console.error(
                "[Razorpay Frontend] Payment verification failed:",
                verifyErr,
              );
              setOrderErr(
                `Payment verified with signature mismatch or database processing error. If money was deducted, please contact support with Payment ID: ${response.razorpay_payment_id}. Error: ${verifyErr.response?.data?.message || verifyErr.message
                }`,
              );
            } finally {
              setVerifyingPayment(false);
            }
          },
          modal: {
            ondismiss: function () {
              console.log(
                "[Razorpay Frontend] Razorpay checkout modal was dismissed by the user.",
              );
              setPaymentMsg(
                "Payment cancelled. You can select a payment method and try again.",
              );
              navigate("/checkout/payment");
            },
          },
          prefill: {
            name: user?.name || payload.address.fullName,
            email: user?.email || "",
            contact: user?.phone
              ? `+91${String(user.phone)
                .replace(/^\+?91/, "")
                .replace(/\D/g, "")}`
              : `+91${String(payload.address.phone)
                .replace(/^\+?91/, "")
                .replace(/\D/g, "")}`,
          },
          readonly: {
            name: true,
            email: true,
            contact: true,
          },
          theme: {
            color: "#78350f",
          },
        };

        if (payMethod === "razorpay") {
          options.config = {
            display: {
              blocks: {
                card: {
                  name: "Pay using Card / Net Banking",
                  instruments: [
                    { method: "card" },
                    { method: "netbanking" },
                    { method: "wallet" },
                  ],
                },
              },
              sequence: ["block.card"],
              preferences: { show_default_blocks: false },
            },
          };
        }

        console.log(
          "[Razorpay Frontend] Initializing Razorpay widget with options:",
          options,
        );
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
      setOrderErr(
        err.response?.data?.message ||
        err.message ||
        "Failed to place order. Please try again.",
      );
    }
  };

  const handleBackClick = () => {
    if (buyNowItem?.slug) {
      navigate(`/products/${buyNowItem.slug}`);
    } else {
      navigate("/cart");
    }
  };

  // ── Loading state while determining initial step ───────────────────
  if (!stepInitialized) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center gap-3 text-amber-500">
        <Loader2 size={20} className="animate-spin" />
        <span className="font-body text-sm">Loading checkout…</span>
      </div>
    );
  }

  return (
    <div className="checkout-page max-w-7xl mx-auto px-2 sm:px-6 pt-2 pb-28 sm:pt-3 sm:pb-8">
      <SEO
        title="Checkout | Namma Oor Karuvattu Kadai"
        description="Complete your order at Namma Oor Karuvattu Kadai — enter your delivery address, review your order, and pay securely."
        url="https://nammaoorkaruvattukadai.com/checkout"
        noindex={true}
      />
      {step === "address" && (
        <div className="hidden md:flex items-center gap-2 mb-3 max-w-xl mx-auto w-full px-1">
          <button
            onClick={handleBackClick}
            className="p-1 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer text-brand-900"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display text-base font-bold text-brand-900">Add delivery address</h1>
        </div>
      )}

      {/* step bar */}
      {step !== "summary" && step !== "payment" && (
        <div className="card p-3.5 sm:p-5 mb-2.5 max-w-xl mx-auto w-full hidden md:block">
          <StepBar current={step} />
        </div>
      )}

      {/* ── Min-order error (address step) ─────────────────────── */}
      {step === "address" && orderErr && (
        <div className="max-w-xl mx-auto w-full mb-3 bg-amber-50 border border-amber-200 text-amber-800 font-body text-sm rounded-xl px-4 py-3">
          {orderErr}
        </div>
      )}

      {/* ── Step panels ─────────────────────────────────────────── */}
      {step === "address" && (
        <div className="max-w-xl mx-auto w-full min-w-[320px]">
          <AddressStep
            savedAddresses={savedAddresses}
            selectedSaved={selectedSaved}
            onSelectSaved={handleSelectSaved}
            onSavedEdited={handleSavedEdited}
            showNewForm={showNewForm}
            onToggleNewForm={() => {
              setShowNewForm((s) => !s);
              // Re-open form: clear previously promoted address if it had no id (was unsaved)
              if (!showNewForm && selectedSaved && !selectedSaved.id) {
                setSelectedSaved(null);
              }
            }}
            newAddress={newAddress}
            onChangeNew={handleChangeNew}
            errors={addrErrors}
            onSaveNew={handleSaveNew}
            onNext={handleAddressNext}
            onBack={handleBackClick}
          />
        </div>
      )}

      {step === "summary" && (
        <OrderSummaryStep
          address={selectedSaved}
          items={checkoutItems}
          sub={sub}
          disc={disc}
          ship={ship}
          tot={tot}
          coupon={coupon}
          onBack={handleBackClick}
          onContinue={() => {
            if (selectedSaved) navigate("/checkout/payment");
          }}
          onChangeAddress={() => setPickerOpen(true)}
          onUpdateQty={handleUpdateQty}
        />
      )}

      {step === "payment" && (
        <PaymentStep
          selected={payMethod}
          onSelect={handleSelectPaymentMethod}
          onPlaceOrder={handlePlaceOrder}
          amount={tot}
          totalMrp={totalMrp}
          discount={(totalMrp - sub) + disc}
          shipping={ship}
          infoMessage={paymentMsg}
          placing={placing}
          error={orderErr}
          placedOrderId={placedOrderId}
          onBack={() => navigate("/checkout/summary", { replace: true })}
          paymentSettings={publicSettings}
        />
      )}

      {/* ── Address picker sheet (opened by "Change" in Order Summary) ── */}
      {pickerOpen && (
        <AddressPickerSheet
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          selectedId={selectedSaved?.id}
          onSelect={(addr) => {
            setSelectedSaved(addr);
            if (addr) {
              setShowNewForm(false);
              setPickerOpen(false);
            }
          }}
          onSavedEdited={handleSavedEdited}
        />
      )}
    </div>
  );
}
