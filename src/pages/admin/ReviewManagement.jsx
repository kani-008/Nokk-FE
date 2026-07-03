import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useParams, useLocation, useNavigate } from "react-router-dom";
import { X, Check, Trash2, Star, ArrowLeft } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AdminPage, StatusBadge, AdminButton,
} from "../../components/admin/AdminUI.jsx";
import TableFormat from "../../components/admin/TableFormat.jsx";
import Dropdown from "../../components/admin/Dropdown.jsx";
import { useAdminProductList } from "../../hookqueries/useProducts";
import API from "../../ApiCall/Api.jsx";
import useViewportPageSize from "../../hookqueries/useViewportPageSize";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function StarRow({ rating, size = 11 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= rating ? "fill-sandal-400 text-sandal-400" : "fill-gray-100 text-gray-300"}
        />
      ))}
    </div>
  );
}

// ── Review detail modal ───────────────────────────────────────────────
function ReviewModal({ review, onClose, onToggleApprove, onDelete }) {
  if (!review) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white admin-modal-bg rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-modal-slide-up">
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
              <StarRow rating={review.rating} size={15} />
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

// ──════════════════════════════════════════════════════════════════════
export default function ReviewManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId } = useParams();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // ── View B state (reset each time a product is opened) ────────────
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("lowest");
  const [selected, setSelected] = useState(null); // review modal

  const queryClient = useQueryClient();
  const { registerSearch, unregisterSearch } = useOutletContext();

  const limit = useViewportPageSize(10, 18);

  // ── View A: product list — shares TanStack Query cache with ProductManagement
  const { data: productsData, isLoading: productsLoading } = useAdminProductList({
    page,
    limit: limit,
    search: debouncedSearch || undefined,
  });
  const products = useMemo(() => productsData?.products || [], [productsData]);
  const totalPages = Math.ceil((productsData?.pagination?.total || 0) / limit) || 1;

  // ── View A: all reviews for per-product pending/total counts ──────
  const { data: allReviews = [] } = useQuery({
    queryKey: ["reviews", "admin", "all"],
    queryFn: async () => {
      const res = await API.get("/products/admin-reviews");
      return res.data.reviews || [];
    },
  });

  const reviewCounts = useMemo(() => {
    const map = {};
    allReviews.forEach((r) => {
      if (!map[r.productId]) map[r.productId] = { total: 0, pending: 0 };
      map[r.productId].total++;
      if (!r.isApproved) map[r.productId].pending++;
    });
    return map;
  }, [allReviews]);

  // ── View B: selected product's reviews ────────────────────────────
  const { data: productReviews = [], isLoading: productReviewsLoading } = useQuery({
    queryKey: ["reviews", "admin", productId],
    queryFn: async () => {
      const res = await API.get(`/products/admin-reviews?productId=${productId}`);
      return res.data.reviews || [];
    },
    enabled: !!productId,
  });

  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    // Find product name in productReviews
    if (productReviews && productReviews.length > 0) {
      return { id: productId, name: productReviews[0].productName };
    }
    // Or location.state (if navigated from list)
    if (location.state?.productName) {
      return { id: productId, name: location.state.productName };
    }
    // Or lookup in allReviews (since reviews might exist but be filtered)
    const foundReview = allReviews.find(r => String(r.productId) === String(productId));
    if (foundReview) {
      return { id: productId, name: foundReview.productName };
    }
    // Or lookup in product list
    const foundProd = products.find(p => String(p.id) === String(productId));
    if (foundProd) {
      return { id: productId, name: foundProd.nameEn };
    }
    return { id: productId, name: "Product Reviews" };
  }, [productId, productReviews, allReviews, products, location.state]);

  const pendingCount = useMemo(
    () => productReviews.filter((r) => !r.isApproved).length,
    [productReviews]
  );

  const filteredReviews = useMemo(() => {
    let list = [...productReviews];
    if (statusFilter === "approved") list = list.filter((r) => r.isApproved);
    if (statusFilter === "pending") list = list.filter((r) => !r.isApproved);
    if (sortOrder === "lowest") list.sort((a, b) => a.rating - b.rating || new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortOrder === "highest") list.sort((a, b) => b.rating - a.rating || new Date(b.createdAt) - new Date(a.createdAt));
    else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [productReviews, statusFilter, sortOrder]);

  // ── Debounce search ───────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // ── Sync topbar search ────────────────────────────────────────────
  useEffect(() => {
    registerSearch({
      placeholder: productId ? "Search reviews…" : "Search products…",
      value: search,
      onChange: setSearch,
    });
    return () => unregisterSearch();
  }, [search, productId, registerSearch, unregisterSearch]);


  // ── Navigation helpers ────────────────────────────────────────────
  const handleSelectProduct = (product) => {
    navigate(`/admin/reviews/${product.id}`, { state: { productName: product.nameEn } });
  };

  const handleBackToProducts = () => {
    queryClient.invalidateQueries({ queryKey: ["reviews", "admin", "all"] });
    navigate("/admin/reviews");
  };

  // ── Moderation handlers ───────────────────────────────────────────
  const handleToggleApprove = async (reviewId, currentApproved) => {
    try {
      const targetApproved = !currentApproved;
      await API.put("/products/admin-approve-review", { reviewId, isApproved: targetApproved });
      queryClient.invalidateQueries({ queryKey: ["reviews", "admin", productId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "admin", "all"] });
      if (selected?.id === reviewId) {
        setSelected((prev) => ({ ...prev, isApproved: targetApproved }));
      }
    } catch (err) {
      console.error("Failed to toggle approval status:", err);
      alert("Failed to update approval status");
    }
  };

  const handleDeleteReview = async (prodId, reviewId) => {
    if (!confirm("Are you sure you want to permanently delete this review? This action cannot be undone.")) return;
    try {
      await API.delete("/products/delete-review", { data: { productId: prodId, reviewId } });
      queryClient.invalidateQueries({ queryKey: ["reviews", "admin", productId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "admin", "all"] });
      setSelected(null);
    } catch (err) {
      console.error("Failed to delete review:", err);
      alert("Failed to delete review");
    }
  };

  // ── View A columns ────────────────────────────────────────────────
  const PRODUCT_COLS = [
    {
      key: "product",
      label: "Product",
      render: (p) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
            {p.primaryImage ? (
              <img src={p.primaryImage} alt={p.nameEn} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}
          </div>
          <span className="font-body text-sm font-semibold text-gray-900 truncate">{p.nameEn}</span>
        </div>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      className: "hidden md:table-cell",
      render: (p) => {
        const avg = parseFloat(p.avgRating) || 0;
        return (
          <div className="flex items-center gap-1.5">
            <StarRow rating={Math.round(avg)} />
            <span className="font-num text-xs text-gray-500">{avg > 0 ? avg.toFixed(1) : "—"}</span>
          </div>
        );
      },
    },
    {
      key: "reviews",
      label: "Reviews",
      render: (p) => {
        const counts = reviewCounts[p.id] || { total: 0, pending: 0 };
        return (
          <div>
            <span className="font-num text-sm text-gray-700">{counts.total}</span>
            {counts.pending > 0 && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mt-0.5">
                {counts.pending} pending
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "action",
      label: "Action",
      width: "120px",
      render: (p) => (
        <button
          onClick={() => handleSelectProduct(p)}
          className="font-body text-xs text-brand-700 hover:underline font-semibold cursor-pointer"
        >
          View Reviews
        </button>
      ),
    },
  ];

  // ── View B columns ────────────────────────────────────────────────
  const REVIEW_COLS = [
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
      render: (r) => <StarRow rating={r.rating} />,
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
      width: "140px",
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
            className={`font-body text-xs hover:underline font-semibold cursor-pointer shrink-0 ${
              r.isApproved ? "text-amber-600 hover:text-amber-800" : "text-green-600 hover:text-green-800"
            }`}
          >
            {r.isApproved ? "Disapprove" : "Approve"}
          </button>
        </div>
      ),
    },
  ];

  // ══════════════════════════════════════════════════════════════════
  // VIEW B — single product's reviews
  // ══════════════════════════════════════════════════════════════════
  if (productId && selectedProduct) {
    const totalReviews = productReviews.length;
    const summaryText = `${totalReviews} review${totalReviews !== 1 ? "s" : ""}${pendingCount > 0 ? ` · ${pendingCount} pending` : ""}`;
    const noReviews = totalReviews === 0;
    const emptyText = noReviews
      ? "This product has no reviews yet."
      : "No reviews match this filter.";

    return (
      <AdminPage key={productId} className="space-y-3">
        {/* Single row: back + title on left, filters on right (stacks on mobile) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full mb-2">
          {/* Left: back button + product name */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleBackToProducts}
              className="p-1.5 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer text-gray-700 shrink-0"
              aria-label="Back to Products"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 truncate">
                {selectedProduct.name}
              </h2>
              <p className="font-body text-[11px] text-gray-500 mt-0.5">{summaryText}</p>
            </div>
          </div>

          {/* Right: filters in one row (always, including mobile) */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {statusFilter && (
              <button
                onClick={() => { setStatusFilter(""); setSortOrder("lowest"); }}
                className="flex items-center gap-1.5 font-body text-xs text-gray-500 hover:text-red-500 transition-colors px-1 cursor-pointer bg-transparent border-none"
              >
                <X size={13} /> Clear
              </button>
            )}
            <div className="w-36 sm:w-44">
              <Dropdown
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: "", label: "All Statuses" },
                  { value: "approved", label: "Approved" },
                  { value: "pending", label: "Pending" },
                ]}
                placeholder="All Statuses"
                className="w-full"
                optionClassName="w-full"
              />
            </div>
            <div className="w-40 sm:w-48">
              <Dropdown
                value={sortOrder}
                onChange={(val) => setSortOrder(val)}
                options={[
                  { value: "lowest", label: "Lowest rating first" },
                  { value: "newest", label: "Newest first" },
                  { value: "highest", label: "Highest rating first" },
                ]}
                className="w-full"
                optionClassName="w-full"
              />
            </div>
          </div>
        </div>

        <TableFormat
          columns={REVIEW_COLS}
          rows={filteredReviews}
          loading={productReviewsLoading}
          emptyText={emptyText}
        />

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

  // ══════════════════════════════════════════════════════════════════
  // VIEW A — product list
  // ══════════════════════════════════════════════════════════════════
  return (
    <AdminPage className="space-y-3">
      <TableFormat
        columns={PRODUCT_COLS}
        rows={products}
        loading={productsLoading}
        onRowClick={handleSelectProduct}
        emptyText="No products found."
      />

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
    </AdminPage>
  );
}

