import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { X, Check, Eye, Trash2, AlertTriangle, Star, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  AdminPage, StatusBadge, AdminButton, AdminCard,
} from "../../components/admin/AdminUI.jsx";
import TableFormat from "../../components/admin/TableFormat.jsx";
import Dropdown from "../../components/admin/Dropdown.jsx";
import API from "../../ApiCall/Api.jsx";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ── Review detail modal ───────────────────────────────────────────────
function ReviewModal({ review, onClose, onToggleApprove, onDelete }) {
  if (!review) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-modal-slide-up">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-display text-base font-bold text-gray-900">Review Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Product</span>
            <p className="font-body text-sm font-semibold text-gray-900">{review.productName}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Reviewer</span>
              <p className="font-body text-sm font-semibold text-gray-900">{review.userName}</p>
              {review.userPhone && <p className="text-xs text-gray-500 font-num">{review.userPhone}</p>}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</span>
              <p className="font-body text-xs text-gray-600">{fmtDate(review.createdAt)}</p>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Rating</span>
            <div className="flex items-center gap-0.5 mt-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={15}
                  className={s <= review.rating ? "fill-sandal-400 text-sandal-400" : "fill-gray-100 text-gray-300"}
                />
              ))}
            </div>
          </div>

          {review.title && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Title</span>
              <p className="font-body text-sm font-bold text-gray-800 leading-snug">{review.title}</p>
            </div>
          )}

          {review.comment && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Comment</span>
              <p className="font-body text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed whitespace-pre-wrap">
                {review.comment}
              </p>
            </div>
          )}

          {review.images && review.images.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Review Photos</span>
              <div className="flex items-center gap-3">
                {review.images.map((img) => (
                  <a
                    key={img.id}
                    href={img.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 block shrink-0"
                  >
                    <img src={img.imageUrl} alt="Review attachment" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* actions */}
        <div className="flex gap-3 p-5 border-t border-gray-100 shrink-0">
          <AdminButton
            variant={review.isApproved ? "outline" : "primary"}
            onClick={() => onToggleApprove(review.id, review.isApproved)}
            className="flex-1 flex items-center justify-center gap-1.5"
          >
            {review.isApproved ? (
              <><X size={14} /> Disapprove</>
            ) : (
              <><Check size={14} /> Approve</>
            )}
          </AdminButton>
          <AdminButton
            variant="danger"
            onClick={() => onDelete(review.productId, review.id)}
            className="flex-1 flex items-center justify-center gap-1.5"
          >
            <Trash2 size={14} /> Delete
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

// ── ReviewManagement Page ─────────────────────────────────────────────
export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "approved" | "pending"
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const { registerSearch, unregisterSearch } = useOutletContext();

  const fetchReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/products/admin-reviews");
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error("Failed to fetch admin reviews:", err);
      setError(err.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Sync filter topbar search box
  useEffect(() => {
    registerSearch({ placeholder: "Search reviewer, product, comments…", value: search, onChange: setSearch });
    return () => unregisterSearch();
  }, [search, registerSearch, unregisterSearch]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Filter reviews locally
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (statusFilter === "approved" && !r.isApproved) return false;
      if (statusFilter === "pending" && r.isApproved) return false;

      if (debouncedSearch) {
        const term = debouncedSearch.toLowerCase();
        return (
          (r.userName || "").toLowerCase().includes(term) ||
          (r.productName || "").toLowerCase().includes(term) ||
          (r.title || "").toLowerCase().includes(term) ||
          (r.comment || "").toLowerCase().includes(term) ||
          String(r.rating).includes(term)
        );
      }
      return true;
    });
  }, [reviews, statusFilter, debouncedSearch]);

  // Pagination
  const limit = 10;
  const totalPages = Math.ceil(filteredReviews.length / limit) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredReviews.slice(start, start + limit);
  }, [filteredReviews, page]);

  const handleToggleApprove = async (reviewId, currentApproved) => {
    try {
      const targetApproved = !currentApproved;
      await API.put("/products/admin-approve-review", { reviewId, isApproved: targetApproved });
      
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, isApproved: targetApproved } : r))
      );

      if (selected?.id === reviewId) {
        setSelected((prev) => ({ ...prev, isApproved: targetApproved }));
      }
    } catch (err) {
      console.error("Failed to toggle approval status:", err);
      alert("Failed to update approval status");
    }
  };

  const handleDeleteReview = async (productId, reviewId) => {
    if (!confirm("Are you sure you want to permanently delete this review? This action cannot be undone.")) return;
    try {
      await API.delete("/products/delete-review", { data: { productId, reviewId } });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setSelected(null);
    } catch (err) {
      console.error("Failed to delete review:", err);
      alert("Failed to delete review");
    }
  };

  const COLS = [
    {
      key: "product",
      label: "Product",
      render: (r) => (
        <div className="flex flex-col min-w-0">
          <span className="font-body text-sm font-semibold text-gray-900 truncate max-w-[180px]">{r.productName}</span>
          <span className="font-body text-[10px] text-gray-400 mt-0.5">Rating: {r.rating}★</span>
        </div>
      ),
    },
    {
      key: "reviewer",
      label: "Reviewer",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-body text-sm text-gray-700 font-semibold">{r.userName}</span>
          {r.userPhone && <span className="font-num text-[10px] text-gray-400 mt-0.5">{r.userPhone}</span>}
        </div>
      ),
    },
    {
      key: "stars",
      label: "Rating",
      className: "hidden md:table-cell",
      render: (r) => (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={11}
              className={s <= r.rating ? "fill-sandal-400 text-sandal-400" : "fill-gray-100 text-gray-300"}
            />
          ))}
        </div>
      ),
    },
    {
      key: "comment",
      label: "Comment",
      render: (r) => (
        <div className="flex flex-col max-w-[260px] min-w-0">
          {r.title && <span className="font-body text-xs font-bold text-gray-800 truncate mb-0.5">{r.title}</span>}
          <span className="font-body text-xs text-gray-500 line-clamp-2 leading-relaxed">{r.comment || "—"}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.isApproved ? "active" : "pending"} />,
    },
    {
      key: "action",
      label: "Action",
      width: "120px",
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelected(r)}
            className="font-body text-xs text-brand-700 hover:underline font-semibold cursor-pointer shrink-0"
          >
            View
          </button>
          <span className="text-gray-300 text-xs">|</span>
          <button
            onClick={() => handleToggleApprove(r.id, r.isApproved)}
            className={`font-body text-xs hover:underline font-semibold cursor-pointer shrink-0 ${r.isApproved ? "text-amber-600 hover:text-amber-800" : "text-green-600 hover:text-green-800"}`}
          >
            {r.isApproved ? "Disapprove" : "Approve"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminPage className="space-y-3">
      {/* Filters bar */}
      <div className="flex items-center justify-end gap-3 w-full">
        {(search || statusFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setPage(1);
            }}
            className="flex items-center gap-1.5 font-body text-sm text-gray-500 hover:text-red-500 transition-colors shrink-0 px-1 cursor-pointer bg-transparent border-none"
          >
            <X size={14} /> Clear
          </button>
        )}

        <div className="w-40 sm:w-44 shrink-0">
          <Dropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Statuses" },
              { value: "approved", label: "Approved" },
              { value: "pending", label: "Pending Moderation" },
            ]}
            placeholder="All Statuses"
            className="rm-filter-fluid"
            optionClassName="rm-filter-fluid"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <TableFormat columns={COLS} rows={paginatedReviews} loading={loading} emptyText="No reviews found." />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <AdminButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </AdminButton>
          <span className="font-body text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <AdminButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </AdminButton>
        </div>
      )}

      {selected && (
        <ReviewModal
          review={selected}
          onClose={() => setSelected(null)}
          onToggleApprove={handleToggleApprove}
          onDelete={handleDeleteReview}
        />
      )}
    </AdminPage>
  );
}
