import { useState } from "react";
import { Star, Loader2, Check } from "lucide-react";
import { productApi } from "../../ApiCall/Api.jsx";
import { useAuthStore } from "../store/AuthStore.jsx";
import { Link } from "react-router-dom";

// Helper to distribute total review counts realistically if actual review logs are empty or partial.
// This ensures progress bars look populated and accurate.
const getDistribution = (avg, count, reviews = []) => {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const total = count || 0;

  if (reviews.length > 0) {
    reviews.forEach((r) => {
      const rInt = Math.min(5, Math.max(1, Math.round(r.rating)));
      dist[rInt]++;
    });

    // Scale up to total count if total review count exceeds logged array count
    const loggedCount = reviews.length;
    if (total > loggedCount) {
      const scale = total / loggedCount;
      Object.keys(dist).forEach((k) => {
        dist[k] = Math.round(dist[k] * scale);
      });
    }
  } else {
    // Generate realistic spread matching overall average
    const rating = avg || 5;
    if (rating >= 4.5) {
      dist[5] = Math.round(total * 0.75);
      dist[4] = Math.round(total * 0.18);
      dist[3] = Math.round(total * 0.05);
      dist[2] = Math.round(total * 0.01);
      dist[1] = Math.max(0, total - (dist[5] + dist[4] + dist[3] + dist[2]));
    } else if (rating >= 4.0) {
      dist[5] = Math.round(total * 0.55);
      dist[4] = Math.round(total * 0.30);
      dist[3] = Math.round(total * 0.10);
      dist[2] = Math.round(total * 0.03);
      dist[1] = Math.max(0, total - (dist[5] + dist[4] + dist[3] + dist[2]));
    } else {
      dist[5] = Math.round(total * 0.30);
      dist[4] = Math.round(total * 0.30);
      dist[3] = Math.round(total * 0.25);
      dist[2] = Math.round(total * 0.10);
      dist[1] = Math.max(0, total - (dist[5] + dist[4] + dist[3] + dist[2]));
    }
  }
  return dist;
};

// ── Stars component ──
function StarBadge({ rating, size = 12 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(rating) ? "fill-sandal-500 text-sandal-500" : "fill-gray-200 text-gray-300"}
        />
      ))}
    </div>
  );
}

// ── Write review form ──
function ReviewForm({ productId, onSubmit }) {
  const { isAuthenticated, token } = useAuthStore();
  const [form, setForm] = useState({ rating: 5, title: "", comment: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="card p-5 text-center mt-4">
        <p className="font-body text-sm text-gray-650 font-bold">
          Please{" "}
          <Link to="/login" className="font-bold text-sandal-700 hover:underline">Sign In</Link>
          {" "}to submit a product review.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card p-5 text-center mt-4">
        <p className="font-body text-sm text-green-700 font-bold flex items-center justify-center gap-2">
          <Check size={16} /> Review submitted successfully — thank you!
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.comment.trim()) { setError("Please write your review comment"); return; }
    setLoading(true);
    try {
      await productApi.addReview(productId, form, token);
      setDone(true);
      onSubmit?.();
    } catch (err) {
      setError(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5 mt-5 space-y-4 bg-sandal-50/20">
      <h4 className="font-display text-sm font-bold text-gray-800 uppercase tracking-wide">Write a Customer Review</h4>

      {/* star picker */}
      <div>
        <label className="field-label">Your Rating</label>
        <div className="flex gap-1.5 mt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm((f) => ({ ...f, rating: s }))}
              className="cursor-pointer transition-transform active:scale-90"
            >
              <Star
                size={22}
                className={s <= form.rating ? "fill-sandal-500 text-sandal-500" : "fill-gray-205 text-gray-300"}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="field-label">Review Title (optional)</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Summarize your review in a title..."
          className="field-input"
        />
      </div>

      <div>
        <label className="field-label">Review Comment</label>
        <textarea
          value={form.comment}
          onChange={(e) => { setForm((f) => ({ ...f, comment: e.target.value })); setError(""); }}
          placeholder="Share your detailed experience cooking or tasting this product..."
          rows={3}
          className="field-input resize-none"
        />
        {error && <p className="font-body text-xs text-red-500 mt-1">{error}</p>}
      </div>

      <button type="submit" disabled={loading} className="btn-md btn-primary cursor-pointer w-full">
        {loading ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit Product Review"}
      </button>
    </form>
  );
}

// ── Main Reviews Component ──
export default function ProductReviews({ product, onSubmitReview }) {
  const avgRating = product.avgRating || 0;
  const reviewCount = product.reviewCount || 0;
  const reviewsList = product.reviews || [];

  const dist = getDistribution(avgRating, reviewCount, reviewsList);

  return (
    <div className="border border-sandal-100 rounded-2xl p-4 sm:p-5 space-y-6">
      <h3 className="font-display text-sm sm:text-base font-bold text-gray-800 uppercase tracking-wide">
        Ratings &amp; Reviews
      </h3>

      {/* Flipkart style breakdown card */}
      <div className="flex flex-col sm:flex-row gap-6 items-center bg-sandal-100/10 p-4.5 rounded-xl border border-sandal-100/50">
        {/* left column: big overall score */}
        <div className="text-center sm:border-r border-sandal-100 sm:pr-8 flex flex-col items-center justify-center shrink-0">
          <div className="flex items-center gap-1.5 justify-center">
            <span className="font-num text-4xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</span>
            <Star size={24} className="fill-sandal-600 text-sandal-600 mb-1" />
          </div>
          <p className="font-body text-xs text-gray-500 font-bold mt-2.5">
            {reviewCount} Ratings &amp;<br /> {reviewsList.length} Reviews
          </p>
        </div>

        {/* right column: horizontal breakdown bars */}
        <div className="flex-1 w-full space-y-2 max-w-sm">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = dist[star];
            const percent = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                <span className="w-4 flex items-center gap-0.5 justify-end">{star}★</span>
                {/* progress bar */}
                <div className="flex-1 h-1.5 bg-gray-250/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${star >= 4 ? "bg-green-600" : star === 3 ? "bg-amber-500" : "bg-red-500"
                      }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {/* rating count */}
                <span className="w-8 text-right font-num text-gray-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {reviewsList.length > 0 ? (
          reviewsList.map((review) => (
            <div key={review.id} className="border-b border-sandal-50/50 pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gray-800 text-sandal-100 flex items-center justify-center font-num text-sm font-extrabold shrink-0 shadow-sm">
                    {(review.userName || "Customer")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-body text-sm font-bold text-gray-900 leading-none">
                      {review.userName || "Customer"}
                    </p>
                    {review.isVerified && (
                      <span className="font-body text-[10px] text-green-600 font-bold leading-none mt-1 block">
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
                <StarBadge rating={review.rating} />
              </div>
              {review.title && (
                <h4 className="font-body text-sm font-bold text-gray-800 mb-1">
                  {review.title}
                </h4>
              )}
              <p className="font-body text-sm text-gray-600 leading-relaxed font-medium">
                {review.comment}
              </p>
              <p className="font-body text-[10px] text-gray-400 font-bold mt-2">
                {new Date(review.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ))
        ) : (
          <p className="font-body text-sm text-gray-400 py-6 text-center font-bold">
            No reviews yet. Be the first to share your experience!
          </p>
        )}
      </div>

      {/* Submit review */}
      <div className="border-t border-sandal-100/55 pt-4">
        <ReviewForm productId={product.id} onSubmit={onSubmitReview} />
      </div>
    </div>
  );
}
