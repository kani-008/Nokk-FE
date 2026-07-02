import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Star, X } from "lucide-react";
import { useAddReview, useUpdateReview, useMyReview } from "../../hookqueries/useProducts";
import { useToast } from "../../components/useToast";
import comboImg from "../../assets/products/combo.jpg";

const PH = comboImg;

export default function ReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { item, initialRating } = location.state || {};

  useEffect(() => {
    if (!item) {
      navigate("/my-orders", { replace: true });
    }
  }, [item, navigate]);

  const [step, setStep] = useState(initialRating ? 2 : 1);
  const [rating, setRating] = useState(initialRating || 0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [reviewId, setReviewId] = useState(null);

  const { setError: setToastError, setSuccess: setToastSuccess, displayedError, displayedType, toastVisible } = useToast();

  const addReviewMutation = useAddReview();
  const updateReviewMutation = useUpdateReview();
  const { data: myReview, refetch: fetchMyReview } = useMyReview(item?.productId);

  const submitting = addReviewMutation.isPending || updateReviewMutation.isPending;

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment || "");
      setReviewId(myReview.id);
      setIsEditing(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [myReview]);

  const ratingLabels = ["Horrible", "Bad", "Average", "Good", "Excellent"];

  const handleSubmit = async () => {
    try {
      if (isEditing && reviewId) {
        await updateReviewMutation.mutateAsync({
          reviewId,
          rating,
          title: "",
          comment: comment.trim(),
          productId: item.productId,
          slug: item.slug || item.productSlug
        });
        setToastSuccess("Review updated successfully!");
        setDone(true);
      } else {
        await addReviewMutation.mutateAsync({
          productId: item.productId,
          rating,
          title: "",
          comment: comment.trim(),
          orderId: item.orderId,
          slug: item.slug || item.productSlug
        });
        setToastSuccess("Review submitted successfully!");
        setDone(true);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        try {
          const { data } = await fetchMyReview();
          if (data) {
            setRating(data.rating);
            setComment(data.comment || "");
            setReviewId(data.id);
            setIsEditing(true);
            setToastError("You have already reviewed this product. Prefilled existing review.");
          } else {
            setToastError("You have already reviewed this product.");
          }
        } catch (fetchErr) {
          console.error(fetchErr);
          setToastError("Failed to fetch your existing review.");
        }
      } else {
        setToastError(err.response?.data?.message || err.message || "Failed to submit review");
      }
    }
  };

  if (!item) return null;

  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-sandal-50 flex flex-col items-center justify-center p-6 md:max-w-md md:mx-auto md:shadow-2xl md:border-x md:border-sandal-200">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto border border-green-200">
            <Check size={28} />
          </div>
          <h3 className="font-display text-lg font-bold text-brand-900">Thank You!</h3>
          <p className="font-body text-sm text-gray-500 max-w-xs">
            Your review was submitted successfully.
          </p>
          <button
            onClick={() => {
              navigate("/my-orders");
            }}
            className="btn-md btn-primary w-full max-w-xs cursor-pointer animate-pulse"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-sandal-50 flex flex-col md:max-w-md md:mx-auto md:shadow-2xl md:border-x md:border-sandal-200 transition-all duration-300">
      {/* ── Toast ── */}
      <div className={`fixed top-4 right-4 z-50 max-w-sm transition-all duration-300 ${toastVisible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0 pointer-events-none"}`}>
        {displayedError && (
          <div className={`flex items-start gap-3 bg-white shadow-2xl border rounded-2xl px-4 py-3.5 text-sm ${displayedType === "success" ? "border-green-200 text-green-700" : "border-red-200 text-red-700"}`}>
            {displayedType === "success" ? <Check size={16} className="shrink-0 mt-0.5" /> : <X size={16} className="shrink-0 mt-0.5" />}
            <span className="leading-snug">{displayedError}</span>
          </div>
        )}
      </div>

      {/* Header banner - sandal theme, no blue */}
      <div className="bg-gray-800 text-sandal-100 px-4 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-gray-700 rounded-lg text-sandal-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <h2 className="font-display text-sm sm:text-base font-bold flex-1 text-center pr-6">
          {isEditing ? "Edit Product Review" : "Review Product"}
        </h2>
      </div>

      {/* Step 1: Rate the product */}
      {step === 1 && (
        <div className="flex-1 overflow-y-auto px-5 py-8 flex flex-col items-center justify-center space-y-6">
          <img
            src={item.imageUrl || item.image || PH}
            alt={item.productName}
            className="w-36 h-36 rounded-2xl object-cover border border-amber-100 bg-amber-50 shadow-sm shrink-0"
            onError={(e) => { e.target.src = PH; }}
          />
          <h3 className="font-body text-xs sm:text-sm font-bold text-gray-900 text-center max-w-xs leading-snug line-clamp-2">
            {item.productName}
          </h3>

          <div className="text-center space-y-1">
            <h4 className="font-display text-lg font-bold text-gray-900">Rate the product</h4>
            <p className="font-body text-xs text-gray-500">
              How did you find this product based on your usage?
            </p>
          </div>

          {/* Big Stars row */}
          <div className="flex justify-between w-full max-w-xs px-2 pt-2 gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => {
              const isSelected = s <= rating;
              return (
                <div key={s} className="flex flex-col items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setRating(s)}
                    className="cursor-pointer transition-transform hover:scale-115 active:scale-95"
                    aria-label={`Rate ${s} star`}
                  >
                    <Star
                      size={32}
                      className={isSelected ? "fill-amber-400 text-amber-400" : "fill-amber-100 text-amber-200"}
                    />
                  </button>
                  <span className={`font-body text-[9px] sm:text-[10px] font-medium leading-none ${isSelected ? "text-amber-700 font-bold" : "text-gray-400"}`}>
                    {ratingLabels[s - 1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Write comments */}
      {step === 2 && (
        <div className="flex-1 overflow-y-auto px-3.5 sm:px-5 py-4.5 flex flex-col space-y-4">
          {/* Mini Header Row */}
          <div className="flex items-center gap-3 border-b border-amber-100/40 pb-3.5 shrink-0">
            <img
              src={item.imageUrl || item.image || PH}
              alt={item.productName}
              className="w-12 h-12 rounded-xl object-cover border border-amber-100 bg-amber-50"
              onError={(e) => { e.target.src = PH; }}
            />
            <div className="min-w-0">
              <p className="font-body text-xs font-bold text-gray-900 line-clamp-1 leading-snug">
                {item.productName}
              </p>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="cursor-pointer transition-transform active:scale-90"
                    aria-label={`Change rating to ${s} stars`}
                  >
                    <Star
                      size={15}
                      className={s <= rating ? "fill-amber-400 text-amber-400" : "fill-amber-100 text-amber-200"}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Text Area Container */}
          <div className="card flex-1 flex flex-col min-h-[120px] p-4 sm:p-5">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="More detailed reviews get more visibility..."
              className="flex-1 w-full font-body text-sm text-gray-800 placeholder-gray-400 bg-transparent resize-none border-none outline-none focus:ring-0 pt-1"
            />
          </div>
        </div>
      )}

      {/* Footer controls - Sandal/grey theme, no blue */}
      {step === 1 && (
        <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between bg-gray-50 shrink-0">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sandal-600" />
            <span className="w-2 h-2 rounded-full bg-gray-300" />
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!rating}
            className="text-sm font-bold text-sandal-700 hover:text-sandal-900 disabled:opacity-40 transition-colors cursor-pointer"
          >
            NEXT
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between bg-gray-50 shrink-0">
          <button
            type="button"
            onClick={() => alert("Image attachment feature is coming soon!")}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <span className="text-sm">📷</span> ADD IMAGE
          </button>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="w-2 h-2 rounded-full bg-sandal-600" />
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="text-sm font-bold text-sandal-700 hover:text-sandal-900 disabled:opacity-40 transition-colors cursor-pointer uppercase"
          >
            {submitting ? "Submitting..." : (comment.trim() ? "Submit" : "Skip & Finish")}
          </button>
        </div>
      )}
    </div>
  );
}
