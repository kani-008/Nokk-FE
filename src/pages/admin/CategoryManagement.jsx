import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Pencil, Trash2, X, Loader2, AlertTriangle, Image as ImageIcon } from "lucide-react";
import {
  AdminPage, StatusBadge, AdminButton,
} from "../../components/admin/AdminUI.jsx";
import TableFormat from "../../components/admin/TableFormat.jsx";
import Toggle from "../../components/admin/Toggle.jsx";
import IconButton from "../../components/admin/IconButton.jsx";
import API from "../../ApiCall/Api.jsx";

const CATEGORY_EMPTY = {
  nameEn: "",
  nameTa: "",
  slug: "",
  imageUrl: "",
  sortOrder: 0,
  isActive: true,
};

// ── Confirm dialog (replaces native confirm()) ─────────────────────────
function ConfirmDialog({ open, title, message, loading, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={loading ? undefined : onCancel} />
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-50 shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-gray-900">{title}</h3>
            <p className="font-body text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <AdminButton variant="outline" onClick={onCancel} disabled={loading} type="button">Cancel</AdminButton>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl px-4 py-2 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Category modal ────────────────────────────────────────────────────────
function CategoryModal({ category, onClose, onSaved }) {
  const isEdit = !!category?.id;
  const [form, setForm] = useState(category ? { ...category } : { ...CATEGORY_EMPTY });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(category?.imageUrl || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-generate slug from English name for categories
  const handleNameEnChange = (e) => {
    const val = e.target.value;
    set("nameEn", val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-") // replace spaces with hyphens
      .replace(/-+/g, "-") // collapse multiple hyphens
      .trim();
    set("slug", generatedSlug);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nameEn.trim()) { setError("English Name is required"); return; }
    if (!form.slug.trim()) { setError("Slug is required"); return; }
    setError("");
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("nameEn", form.nameEn.trim());
      formData.append("nameTa", form.nameTa ? form.nameTa.trim() : "");
      formData.append("slug", form.slug.trim().toLowerCase());
      formData.append("sortOrder", String(form.sortOrder || 0));
      formData.append("isActive", String(form.isActive));

      if (isEdit) {
        formData.append("id", category.id);
      }
      if (selectedFile) {
        formData.append("imageFile", selectedFile);
      }

      let res;
      if (isEdit) {
        res = await API.put("/categories/update-category", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await API.post("/categories/create-category", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      onSaved(res.data.category);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white admin-modal-bg rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display text-base font-bold text-gray-900">{isEdit ? "Edit Category" : "Add Category"}</h3>
          <IconButton onClick={onClose} aria-label="Close"><X size={18} /></IconButton>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-2.5">{error}</div>}

          <div>
            <label className="field-label">English Name *</label>
            <input value={form.nameEn} onChange={handleNameEnChange} placeholder="Dry Fish" className="field-input" required />
          </div>

          <div>
            <label className="field-label">Tamil Name</label>
            <input value={form.nameTa} onChange={(e) => set("nameTa", e.target.value)} placeholder="கருவாடு" className="field-input" />
          </div>

          <div>
            <label className="field-label">Slug * (Unique identifier in URL)</label>
            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="dry-fish" className="field-input" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)} className="field-input" />
            </div>
            <div>
              <label className="field-label">Status</label>
              <div className="flex items-center h-[42px]">
                <Toggle checked={form.isActive} onChange={() => set("isActive", !form.isActive)} />
                <span className="font-body text-sm text-gray-600 ml-2">{form.isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="field-label">Category Thumbnail</label>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="category-file-input" />
                <label htmlFor="category-file-input" className="inline-flex items-center px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors">
                  Choose Image
                </label>
                <p className="text-[10px] text-gray-400 mt-1">Recommended size: 300x300. Max: 3MB.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <AdminButton variant="outline" onClick={onClose} disabled={saving}>Cancel</AdminButton>
            <AdminButton variant="primary" type="submit" disabled={saving}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save Category"}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── CategoryManagement Page ─────────────────────────────────────────────
export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState(null); // active category for modal
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // active category for delete confirm
  const [deleting, setDeleting] = useState(false);

  const { registerSearch, unregisterSearch } = useOutletContext();

  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/categories/admin-all");
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Failed to fetch admin categories:", err);
      setError(err.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchCategories(); }, []);

  // Sync with global header search
  useEffect(() => {
    registerSearch({ placeholder: "Search categories…", value: search, onChange: setSearch });
    return () => unregisterSearch();
  }, [search, registerSearch, unregisterSearch]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Filter categories locally
  const filteredCategories = useMemo(() => {
    if (!debouncedSearch) return categories;
    const term = debouncedSearch.toLowerCase();
    return categories.filter(
      (c) =>
        (c.nameEn || "").toLowerCase().includes(term) ||
        (c.nameTa || "").toLowerCase().includes(term) ||
        (c.slug || "").toLowerCase().includes(term)
    );
  }, [categories, debouncedSearch]);

  const handleSaved = (savedCategory) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === savedCategory.id);
      if (exists) {
        return prev.map((c) => (c.id === savedCategory.id ? savedCategory : c));
      } else {
        return [...prev, savedCategory].sort((a, b) => a.sortOrder - b.sortOrder);
      }
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete("/categories/delete-category", { data: { id: deleteTarget.id } });
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete category failed:", err);
      setError(err.response?.data?.message || "Failed to delete category");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const COLS = [
    {
      key: "image",
      label: "Thumbnail",
      width: "80px",
      render: (r) => (
        <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
          {r.imageUrl ? (
            <img src={r.imageUrl} alt={r.nameEn} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={18} className="text-gray-300" />
          )}
        </div>
      ),
    },
    {
      key: "name",
      label: "Name (En / Ta)",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-body text-sm font-semibold text-gray-900">{r.nameEn}</span>
          {r.nameTa && <span className="font-tamil text-xs text-amber-600 mt-0.5">{r.nameTa}</span>}
        </div>
      ),
    },
    {
      key: "slug",
      label: "Slug",
      render: (r) => <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">{r.slug}</code>,
    },
    {
      key: "sortOrder",
      label: "Sort Order",
      render: (r) => <span className="font-num text-sm text-gray-700">{r.sortOrder}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.isActive ? "active" : "blocked"} />,
    },
    {
      key: "action",
      label: "Action",
      width: "120px",
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelected(r);
              setModalOpen(true);
            }}
            className="p-1.5 text-gray-400 hover:text-brand-800 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            title="Edit Category"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteTarget(r)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Category"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminPage className="space-y-4">
      {/* Action Header */}
      <div className="flex justify-between items-center w-full">
        <div>
          <h2 className="font-display text-lg font-bold text-gray-900">Categories</h2>
          <p className="font-body text-xs text-gray-500 mt-0.5">Manage dry fish and seafood categories</p>
        </div>
        <AdminButton
          variant="primary"
          onClick={() => {
            setSelected(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5"
        >
          <Plus size={16} /> Add Category
        </AdminButton>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <TableFormat columns={COLS} rows={filteredCategories} loading={loading} emptyText="No categories found." />

      {modalOpen && (
        <CategoryModal
          category={selected}
          onClose={() => {
            setSelected(null);
            setModalOpen(false);
          }}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={`Are you sure you want to permanently delete "${deleteTarget?.nameEn}"? This action cannot be undone and is blocked if any active products belong to this category.`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </AdminPage>
  );
}

