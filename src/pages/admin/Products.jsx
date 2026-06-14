import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, Sparkles, Image, X, Trash } from 'lucide-react';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';

export default function Products() {
  const addToast = useToastStore(state => state.addToast);
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form Fields State
  const [nameEn, setNameEn] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [howToUse, setHowToUse] = useState('');
  const [storageTips, setStorageTips] = useState('');
  const [imageUrl, setImageUrl] = useState('/assets/products/nethili.jpg');
  const [variants, setVariants] = useState([{ weight: '250g', price: 100, mrp: 120, stock: 50 }]);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  const loadCatalog = () => {
    api.getProducts().then(setProducts);
    api.getCategories().then(setCategories);
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Slug auto generation
  const handleNameEnChange = (e) => {
    const value = e.target.value;
    setNameEn(value);
    // auto-generate slug
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(generatedSlug);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setNameEn('');
    setNameTa('');
    setSlug('');
    setCategory(categories[0]?.id || 'dry-fish');
    setDescription('');
    setHowToUse('');
    setStorageTips('');
    setImageUrl('/assets/products/nethili.jpg');
    setVariants([{ weight: '250g', price: 100, mrp: 120, stock: 50 }]);
    setIsBestseller(false);
    setIsNew(true);
    setDiscountPercent(0);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setNameEn(product.nameEn);
    setNameTa(product.nameTa);
    setSlug(product.slug);
    setCategory(product.category);
    setDescription(product.description);
    setHowToUse(product.howToUse || '');
    setStorageTips(product.storageTips || '');
    setImageUrl(product.image);
    setVariants(product.variants.map(v => ({ ...v })));
    setIsBestseller(product.isBestseller || false);
    setIsNew(product.isNew || false);
    setDiscountPercent(product.discountPercent || 0);
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!nameEn || !nameTa || !slug || !description || variants.length === 0) {
      addToast('Please fill in all required product fields.', 'warning');
      return;
    }

    const payload = {
      id: editingProduct?.id,
      nameEn,
      nameTa,
      slug,
      category,
      description,
      howToUse,
      storageTips,
      image: imageUrl,
      images: [imageUrl],
      variants,
      isBestseller,
      isNew,
      discountPercent: parseInt(discountPercent) || 0,
      inStock: variants.reduce((acc, curr) => acc + curr.stock, 0) > 0
    };

    api.saveProduct(payload).then(() => {
      addToast(editingProduct ? 'Product updated successfully!' : 'New product cataloged successfully!', 'success');
      setIsFormOpen(false);
      loadCatalog();
    });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete product: "${name}"?`)) {
      api.deleteProduct(id).then(() => {
        addToast('Product removed from catalog.', 'info');
        loadCatalog();
      });
    }
  };

  const handleToggleStatus = (id) => {
    api.toggleProductStatus(id).then(() => {
      addToast('Product stock status toggled.', 'info');
      loadCatalog();
    });
  };

  // Variant row controls
  const handleAddVariantRow = () => {
    setVariants([...variants, { weight: '500g', price: 150, mrp: 180, stock: 20 }]);
  };

  const handleRemoveVariantRow = (idx) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (idx, field, value) => {
    const updated = variants.map((v, i) => {
      if (i === idx) {
        return { ...v, [field]: value };
      }
      return v;
    });
    setVariants(updated);
  };

  // Columns definition for DataTable
  const tableColumns = [
    {
      key: 'image',
      label: 'Image',
      render: (row) => (
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-brand-sand">
          <img src={row.image} alt={row.nameEn} className="w-full h-full object-cover" />
        </div>
      )
    },
    {
      key: 'nameEn',
      label: 'Product details',
      sortable: true,
      render: (row) => (
        <div>
          <h4 className="font-tiro-tamil text-brand-primary font-bold text-xs">{row.nameTa}</h4>
          <h5 className="font-playfair text-brand-dark/85 font-semibold text-[11px] mt-0.5">{row.nameEn}</h5>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (row) => <span className="bg-brand-sand/50 text-brand-ocean text-[10px] font-bold px-2 py-0.5 rounded uppercase">{row.category}</span>
    },
    {
      key: 'price',
      label: 'Pricing & Weight',
      render: (row) => (
        <div className="font-space text-[10px] space-y-0.5">
          {row.variants.map((v) => (
            <p key={v.weight}>
              <strong className="text-brand-dark">{v.weight}:</strong> <span className="text-brand-primary">₹{v.price}</span> 
              {v.mrp > v.price && <span className="text-brand-dark/45 line-through ml-1">₹{v.mrp}</span>}
            </p>
          ))}
        </div>
      )
    },
    {
      key: 'stock',
      label: 'Current Stock',
      render: (row) => (
        <div className="font-space text-[10px] space-y-0.5 font-bold">
          {row.variants.map((v) => (
            <p key={v.weight} className={v.stock < 10 ? 'text-rose-600' : 'text-emerald-700'}>
              {v.weight}: {v.stock} pcs
            </p>
          ))}
        </div>
      )
    },
    {
      key: 'inStock',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <button
          onClick={() => handleToggleStatus(row.id)}
          className={`flex items-center gap-1 font-bold text-[10px] ${row.inStock ? 'text-emerald-700' : 'text-rose-600'}`}
          title="Click to toggle status"
        >
          {row.inStock ? (
            <CheckCircle2 className="w-4 h-4 fill-emerald-50 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 fill-rose-50 text-rose-600 shrink-0" />
          )}
          {row.inStock ? 'ACTIVE' : 'OUT'}
        </button>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1 text-brand-ocean hover:text-brand-primary hover:bg-brand-sand/30 rounded cursor-pointer"
            title="Edit Product"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id, row.nameEn)}
            className="p-1 text-brand-dark/40 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 font-inter pb-10">
      {/* Page headers */}
      <div className="flex justify-between items-center border-b border-brand-sand pb-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-brand-ocean">Product Inventory</h1>
          <p className="text-xs text-brand-dark/50 font-medium mt-1">Configure weights, pricing variants, and stock status indicators</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-brand-primary text-brand-cream py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-brand-secondary active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" /> Add New Product
        </button>
      </div>

      {/* Catalog Listing using DataTable */}
      <DataTable
        columns={tableColumns}
        data={products}
        searchPlaceholder="Search products by English or Tamil name..."
        searchKeys={['nameEn', 'nameTa', 'category', 'description']}
      />

      {/* Add / Edit Product Slideover / Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProduct ? `Edit Catalog Product - ${nameEn}` : 'Add Product to Catalog'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* English Title */}
            <div className="flex flex-col gap-1.5">
              <label>Product Name (English) <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={handleNameEnChange}
                placeholder="e.g. Premium Nethili Karuvadu"
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
              />
            </div>
            {/* Tamil Title */}
            <div className="flex flex-col gap-1.5">
              <label>Product Name (Tamil) <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={nameTa}
                onChange={(e) => setNameTa(e.target.value)}
                placeholder="e.g. நெத்திலி கருவாடு"
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium font-tiro-tamil"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SEO Slug */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1 text-brand-dark/70">
                SEO Slug Link <Sparkles className="w-3.5 h-3.5 text-brand-secondary" />
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="e.g. premium-nethili-karuvadu"
                className="bg-brand-cream border border-brand-sand/50 text-brand-dark/50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none font-mono"
              />
            </div>
            {/* Category selection */}
            <div className="flex flex-col gap-1.5">
              <label>Website Category <span className="text-rose-500">*</span></label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary cursor-pointer font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameEn} ({c.nameTa})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label>Product Description <span className="text-rose-500">*</span></label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clean authentic details about preparation and village source..."
              className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
            />
          </div>

          {/* How to use & Storage tabs inside form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label>How to Prepare/Use</label>
              <textarea
                rows={2}
                value={howToUse}
                onChange={(e) => setHowToUse(e.target.value)}
                placeholder="Instructions on washing excess salt or cooking method..."
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label>Storage & Care Instructions</label>
              <textarea
                rows={2}
                value={storageTips}
                onChange={(e) => setStorageTips(e.target.value)}
                placeholder="Airtight containers, refrigerations details..."
                className="bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
              />
            </div>
          </div>

          {/* Image Upload Drag Zone simulation */}
          <div className="flex flex-col gap-1.5">
            <label>Catalog Photo Link</label>
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 bg-brand-cream border border-brand-sand rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary font-medium"
              />
              <div className="w-12 h-12 rounded-xl border border-brand-sand overflow-hidden shrink-0 bg-brand-cream/35 flex items-center justify-center">
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
              </div>
            </div>
            {/* Drag & drop simulated box */}
            <div className="border-2 border-dashed border-brand-sand/80 bg-brand-cream/15 p-4 rounded-xl text-center text-brand-dark/45 mt-1 cursor-pointer hover:bg-brand-sand/10 transition-colors">
              <Image className="w-6 h-6 text-brand-primary mx-auto mb-1 opacity-70 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Drag & drop or Click to simulate file upload</p>
            </div>
          </div>

          {/* Badges toggles */}
          <div className="flex flex-wrap gap-4 pt-1 bg-brand-cream/20 p-3.5 rounded-xl border border-brand-sand/40">
            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={(e) => setIsBestseller(e.target.checked)}
                className="accent-brand-primary w-4 h-4 rounded"
              />
              <span>Mark as Bestseller</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="accent-brand-primary w-4 h-4 rounded"
              />
              <span>Mark as New Release</span>
            </label>

            <div className="flex items-center gap-2">
              <label>Discount (%):</label>
              <input
                type="number"
                min="0"
                max="90"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-16 bg-white border border-brand-sand rounded px-2 py-1 focus:outline-none"
              />
            </div>
          </div>

          {/* Weight Variants list editor */}
          <div className="space-y-2.5 border-t border-brand-sand/55 pt-4">
            <div className="flex justify-between items-center">
              <label className="font-bold text-brand-ocean text-xs">Weight Variants Pricing & Stock</label>
              <button
                type="button"
                onClick={handleAddVariantRow}
                className="bg-brand-ocean text-brand-cream px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-brand-primary transition-colors cursor-pointer shadow-sm"
              >
                + Add Variant Row
              </button>
            </div>

            <div className="space-y-2">
              {variants.map((v, index) => (
                <div key={index} className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 bg-white border border-brand-sand/65 p-3 rounded-xl">
                  {/* Weight select */}
                  <div className="flex flex-col gap-1 w-20 shrink-0">
                    <span className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider">Weight</span>
                    <select
                      value={v.weight}
                      onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                      className="bg-brand-cream border border-brand-sand rounded-lg px-2.5 py-1 text-[11px] font-bold focus:outline-none"
                    >
                      <option value="250g">250g</option>
                      <option value="500g">500g</option>
                      <option value="1kg">1kg</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div className="flex flex-col gap-1 flex-1 min-w-[70px]">
                    <span className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider">Price (₹)</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={v.price}
                      onChange={(e) => handleVariantChange(index, 'price', parseInt(e.target.value) || 0)}
                      className="bg-brand-cream border border-brand-sand rounded-lg px-2.5 py-1 text-[11px] font-bold focus:outline-none"
                    />
                  </div>

                  {/* MRP */}
                  <div className="flex flex-col gap-1 flex-1 min-w-[70px]">
                    <span className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider">MRP (₹)</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={v.mrp}
                      onChange={(e) => handleVariantChange(index, 'mrp', parseInt(e.target.value) || 0)}
                      className="bg-brand-cream border border-brand-sand rounded-lg px-2.5 py-1 text-[11px] font-bold focus:outline-none"
                    />
                  </div>

                  {/* Stock */}
                  <div className="flex flex-col gap-1 flex-1 min-w-[70px]">
                    <span className="text-[10px] text-brand-dark/45 font-bold uppercase tracking-wider">Stock</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={v.stock}
                      onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value) || 0)}
                      className="bg-brand-cream border border-brand-sand rounded-lg px-2.5 py-1 text-[11px] font-bold focus:outline-none"
                    />
                  </div>

                  {/* Delete row */}
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariantRow(index)}
                      className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 mt-4 shrink-0"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  )}

                </div>
              ))}
            </div>
          </div>

          {/* Form Submit actions */}
          <div className="pt-4 flex justify-end gap-3 border-t border-brand-sand/55 font-bold text-xs">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="border border-brand-sand px-5 py-2.5 rounded-xl hover:bg-brand-sand/15 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-brand-primary text-brand-cream px-6 py-2.5 rounded-xl hover:bg-brand-secondary active:scale-95 transition-all shadow cursor-pointer"
            >
              {editingProduct ? 'Save Product Catalog' : 'Catalog Product'}
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
}
