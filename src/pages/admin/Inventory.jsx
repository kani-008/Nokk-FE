import React, { useState, useEffect } from 'react';
import { Layers, Save, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import DataTable from '../../components/DataTable';

export default function Inventory() {
  const addToast = useToastStore(state => state.addToast);

  const [products, setProducts] = useState([]);
  
  // Track inline edits: key is `${productId}-${weight}`, value is current number
  const [editedStock, setEditedStock] = useState({});

  const loadInventory = () => {
    api.getProducts().then(setProducts);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleStockChange = (productId, weight, val) => {
    const key = `${productId}-${weight}`;
    setEditedStock(prev => ({
      ...prev,
      [key]: parseInt(val) || 0
    }));
  };

  const handleSaveStock = (product, weight) => {
    const key = `${product.id}-${weight}`;
    const newStock = editedStock[key];
    
    if (newStock === undefined) return;

    // Load full product
    const fullProduct = products.find(p => p.id === product.id);
    if (!fullProduct) return;

    // Update variants stock
    const updatedVariants = fullProduct.variants.map(v => {
      if (v.weight === weight) {
        return { ...v, stock: newStock };
      }
      return v;
    });

    const hasStock = updatedVariants.some(v => v.stock > 0);
    const updatedProduct = {
      ...fullProduct,
      variants: updatedVariants,
      inStock: hasStock
    };

    api.saveProduct(updatedProduct).then(() => {
      addToast(`Stock for ${product.nameEn} (${weight}) updated to ${newStock} units.`, 'success');
      
      // Clear edited indicator
      setEditedStock(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });

      loadInventory();
    });
  };

  // Flatten products into variants for easier DataTable representation
  const flattenedInventory = [];
  products.forEach(p => {
    p.variants.forEach(v => {
      flattenedInventory.push({
        id: `${p.id}-${v.weight}`,
        productId: p.id,
        nameEn: p.nameEn,
        nameTa: p.nameTa,
        weight: v.weight,
        stock: v.stock,
        image: p.image,
        category: p.category,
        reorderLevel: v.weight === '1kg' ? 5 : v.weight === '500g' ? 10 : 15, // dynamic standard reorder level
        fullProduct: p
      });
    });
  });

  // Columns definition for Inventory
  const tableColumns = [
    {
      key: 'image',
      label: 'Image',
      render: (row) => (
        <div className="w-9 h-9 rounded border border-brand-sand overflow-hidden">
          <img src={row.image} alt={row.nameEn} className="w-full h-full object-cover" />
        </div>
      )
    },
    {
      key: 'nameEn',
      label: 'Product',
      sortable: true,
      render: (row) => (
        <div>
          <h4 className="font-tiro-tamil text-brand-primary font-bold text-xs">{row.nameTa}</h4>
          <h5 className="font-playfair text-brand-dark/85 font-semibold text-[11px] mt-0.5">{row.nameEn}</h5>
        </div>
      )
    },
    {
      key: 'weight',
      label: 'Variant Weight',
      sortable: true,
      render: (row) => <span className="font-space bg-brand-sand/50 text-brand-ocean text-[10px] font-bold px-2.5 py-0.5 rounded-full">{row.weight}</span>
    },
    {
      key: 'reorderLevel',
      label: 'Reorder Level',
      sortable: true,
      render: (row) => <span className="font-space text-brand-dark/50 font-bold">{row.reorderLevel} pcs</span>
    },
    {
      key: 'stock',
      label: 'Stock Level & Alert',
      sortable: true,
      render: (row) => {
        const isLow = row.stock < row.reorderLevel;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-space font-bold px-2 py-0.5 rounded text-[11px] ${
              isLow 
                ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
              {row.stock} pcs
            </span>
            {isLow && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" /> LOW Stock
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'editStock',
      label: 'Inline Update Stock',
      render: (row) => {
        const key = `${row.productId}-${row.weight}`;
        const currentVal = editedStock[key] !== undefined ? editedStock[key] : row.stock;
        const hasEdited = editedStock[key] !== undefined;

        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={currentVal}
              onChange={(e) => handleStockChange(row.productId, row.weight, e.target.value)}
              className="w-16 bg-brand-cream border border-brand-sand rounded px-2.5 py-1 text-[11px] font-bold focus:outline-none focus:border-brand-primary"
            />
            {hasEdited && (
              <button
                onClick={() => handleSaveStock(row.fullProduct, row.weight)}
                className="p-1 bg-brand-primary text-brand-cream rounded-lg hover:bg-brand-secondary active:scale-95 transition-all shadow-sm cursor-pointer"
                title="Save Stock Level"
              >
                <Save className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 font-inter pb-10">
      {/* Headers */}
      <div className="flex justify-between items-center border-b border-brand-sand pb-4">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-brand-ocean">Inventory Stock</h1>
          <p className="text-xs text-brand-dark/50 font-medium mt-1">Monitor individual variant stocks and save levels directly inline</p>
        </div>
      </div>

      {/* Inventory table */}
      <DataTable
        columns={tableColumns}
        data={flattenedInventory}
        searchPlaceholder="Search warehouse stock by product name..."
        searchKeys={['nameEn', 'nameTa', 'weight']}
      />
    </div>
  );
}
