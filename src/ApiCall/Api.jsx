// ─────────────────────────────────────────────────────────────────────
// src/ApiCall/Api.jsx (Decoupled Mock Database Client)
// ─────────────────────────────────────────────────────────────────────
import productsDb from "../assets/products.json";
import categoriesDb from "../assets/categories.json";
import bannersDb from "../assets/banners.json";
import offersDb from "../assets/offers.json";
import comboImg from "../assets/products/combo.jpg";
import { useAuthStore } from "../components/store/AuthStore";

// ── Image Mapper ──────────────────────────────────────────────────────
// Dynamically forces all images in the database to use the single combo.jpg asset
const mapProductImages = (p) => ({
  ...p,
  primaryImage: comboImg,
  images: [
    { id: "img-1", imageUrl: comboImg, sortOrder: 1, isPrimary: true }
  ]
});

const mapCategoryImage = (c) => ({
  ...c,
  imageUrl: comboImg
});

const mapBannerImage = (b) => ({
  ...b,
  imageUrl: comboImg
});

// ── Database Initialization ───────────────────────────────────────────
const getLocalStorage = (key, initialData) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return initialData;
  }
};

const setLocalStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const getProducts = () => getLocalStorage("nok-mock-products-v3", productsDb).map(mapProductImages);
const getCategories = () => getLocalStorage("nok-mock-categories", categoriesDb).map(mapCategoryImage);
const getBanners = () => getLocalStorage("nok-mock-banners", bannersDb).map(mapBannerImage);
const getOffers = () => getLocalStorage("nok-mock-offers", offersDb);
const getOrders = () => getLocalStorage("nok-mock-orders", []);
const getUsers = () => getLocalStorage("nok-mock-users", [
  { id: "user-1", fullName: "Balaji Ram", email: "balaji@nammakadai.com", phone: "9876543210", role: "admin", status: "active", createdAt: "2026-05-01" },
  { id: "user-2", fullName: "Customer Account", email: "customer@nammakadai.com", phone: "9000000000", role: "customer", status: "active", createdAt: "2026-06-01" }
]);
const getCart = () => getLocalStorage("nok-mock-cart", { items: [] });
const getWishlist = () => getLocalStorage("nok-mock-wishlist", { items: [] });
const getSettings = () => getLocalStorage("nok-mock-settings", {
  storeName: "Namma Oor Karuvattu Kadai",
  storeEmail: "hello@nammakadai.com",
  storePhone: "+91 98765 43210",
  freeShippingThreshold: 499,
  shippingCharge: 60,
  gstPercentage: 5
});

// Helper to simulate network latency
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to resolve current user session
const getCurrentUser = (token) => {
  const users = getUsers();
  if (token === "admin-token") return users.find(u => u.role === "admin");
  return users.find(u => u.role !== "admin") || users[0];
};

// ═════════════════════════════════════════════════════════════════════
// AUTH — real API
// ═════════════════════════════════════════════════════════════════════
const AUTH_BASE = `${import.meta.env.VITE_LHOST_API_URL}/auth`;

export const authApi = {
  // returns { accessToken, refreshToken, user }
  login: (data) =>
    apiFetch(`${AUTH_BASE}/user-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }, false),

  logout: (refreshToken, token) =>
    apiFetch(`${AUTH_BASE}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ refreshToken }),
    }, false),

  refresh: (refreshToken) =>
    apiFetch(`${AUTH_BASE}/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }, false),

  // Forgot-password OTP flow
  sendOtp: (data) =>
    apiFetch(`${AUTH_BASE}/otp-create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }, false),

  verifyOtp: (data) =>
    apiFetch(`${AUTH_BASE}/otp-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }, false),

  resetPassword: (data) =>
    apiFetch(`${AUTH_BASE}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }, false),

  register: (data) =>
    apiFetch(`${AUTH_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }, false),
};

// ═════════════════════════════════════════════════════════════════════
// PRODUCTS MOCK
// ═════════════════════════════════════════════════════════════════════
export const productApi = {
  list: async (params = "") => {
    await delay();
    const products = getProducts();
    const urlParams = new URLSearchParams(params);

    const search       = urlParams.get("search") || "";
    const category     = urlParams.get("category") || "";
    const sort         = urlParams.get("sort") || "popular";
    const inStock      = urlParams.get("inStock") === "true";
    const isBestseller = urlParams.get("isBestseller") === "true";
    const isNew        = urlParams.get("isNew") === "true";
    const minPrice     = urlParams.get("minPrice") ? parseFloat(urlParams.get("minPrice")) : null;
    const maxPrice      = urlParams.get("maxPrice") ? parseFloat(urlParams.get("maxPrice")) : null;
    const minRating     = urlParams.get("rating") ? parseFloat(urlParams.get("rating")) : null;
    const weights        = (urlParams.get("weight") || "").split(",").filter(Boolean);
    const hasOffer       = urlParams.get("hasOffer") === "true";
    const page          = parseInt(urlParams.get("page") || "1");
    const limit          = parseInt(urlParams.get("limit") || "12");

    // helper — cheapest variant price, mirrors v_products_with_price.min_price
    const minVariantPrice = (p) =>
      p.variants.length ? Math.min(...p.variants.map(v => v.price)) : (p.minPrice || 0);

    let filtered = products;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        p => p.nameEn.toLowerCase().includes(q) ||
             (p.nameTa && p.nameTa.toLowerCase().includes(q)) ||
             p.description.toLowerCase().includes(q)
      );
    }

    if (category) {
      filtered = filtered.filter(p => p.categorySlug === category);
    }

    if (isBestseller) {
      filtered = filtered.filter(p => p.isBestseller);
    }

    if (isNew) {
      filtered = filtered.filter(p => p.isNew);
    }

    if (inStock) {
      filtered = filtered.filter(p => p.variants.some(v => v.stockQty > 0));
    }

    if (minPrice !== null) {
      filtered = filtered.filter(p => minVariantPrice(p) >= minPrice);
    }
    if (maxPrice !== null) {
      filtered = filtered.filter(p => minVariantPrice(p) <= maxPrice);
    }

    if (minRating !== null) {
      filtered = filtered.filter(p => (p.avgRating || 0) >= minRating);
    }

    // weight/pack-size filter — match if ANY variant's weightLabel matches a selected size
    if (weights.length > 0) {
      filtered = filtered.filter(p =>
        p.variants.some(v => weights.includes(v.weightLabel))
      );
    }

    // offers filter — mock has no per-product offer linkage yet, so this checks
    // a simple heuristic (variant has a comparePrice higher than price, i.e. a discount).
    // Real backend will check the `offers` table via product_id/category_id per the plan.
    if (hasOffer) {
      filtered = filtered.filter(p =>
        p.variants.some(v => v.comparePrice && v.comparePrice > v.price)
      );
    }

    // Sort sorting logic
    if (sort === "newest") {
      filtered = [...filtered].sort((a, b) => b.id.localeCompare(a.id));
    } else if (sort === "price-low-high") {
      filtered = [...filtered].sort((a, b) => minVariantPrice(a) - minVariantPrice(b));
    } else if (sort === "price-high-low") {
      filtered = [...filtered].sort((a, b) => minVariantPrice(b) - minVariantPrice(a));
    } else if (sort === "popularity" || sort === "popular") {
      // proxy until a real units_sold counter exists — see backend plan
      filtered = [...filtered].sort((a, b) =>
        (b.reviewCount || 0) - (a.reviewCount || 0) || (b.avgRating || 0) - (a.avgRating || 0)
      );
    } else if (sort === "relevance") {
      // only meaningful with an active search term; falls back to newest otherwise
      if (search) {
        const q = search.toLowerCase();
        const score = (p) => {
          const name = p.nameEn.toLowerCase();
          if (name === q) return 3;
          if (name.startsWith(q)) return 2;
          if (name.includes(q)) return 1;
          return 0;
        };
        filtered = [...filtered].sort((a, b) => score(b) - score(a));
      } else {
        filtered = [...filtered].sort((a, b) => b.id.localeCompare(a.id));
      }
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      success: true,
      products: paginated,
      pagination: { total, page, limit, totalPages }
    };
  },

  bySlug: async (slug) => {
    await delay();
    const products = getProducts();
    const product = products.find(p => p.slug === slug);
    if (!product) {
      throw new Error("Product not found");
    }
    return { success: true, product };
  },

  addReview: async (id, data, token) => {
    await delay();
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      const user = getCurrentUser(token);
      const newReview = {
        id: `rev-${Date.now()}`,
        userName: user.fullName,
        rating: data.rating || 5,
        title: data.title || "",
        comment: data.comment || "",
        isVerified: true,
        createdAt: new Date().toISOString().split("T")[0]
      };
      products[idx].reviews = products[idx].reviews || [];
      products[idx].reviews.unshift(newReview);
      
      // Update average rating
      const totalRatings = products[idx].reviews.reduce((sum, r) => sum + r.rating, 0);
      products[idx].reviewCount = products[idx].reviews.length;
      products[idx].avgRating = parseFloat((totalRatings / products[idx].reviewCount).toFixed(1));

      setLocalStorage("nok-mock-products", products);
      return { success: true, review: newReview };
    }
    throw new Error("Product not found");
  },

  deleteReview: async (id, rId, token) => {
    await delay();
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx].reviews = (products[idx].reviews || []).filter(r => r.id !== rId);
      products[idx].reviewCount = products[idx].reviews.length;
      const totalRatings = products[idx].reviews.reduce((sum, r) => sum + r.rating, 0);
      products[idx].avgRating = products[idx].reviewCount > 0 ? parseFloat((totalRatings / products[idx].reviewCount).toFixed(1)) : 0;
      setLocalStorage("nok-mock-products", products);
      return { success: true };
    }
    throw new Error("Product not found");
  },

  // Admin CRUD
  create: async (data, token) => {
    await delay();
    const products = getProducts();
    const newProduct = {
      ...data,
      id: `prod-${Date.now()}`,
      slug: data.slug || (data.nameEn || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      reviews: [],
      avgRating: 0,
      reviewCount: 0,
      isActive: true
    };
    products.push(newProduct);
    setLocalStorage("nok-mock-products", products);
    return { success: true, product: mapProductImages(newProduct) };
  },

  update: async (id, data, token) => {
    await delay();
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...data };
      setLocalStorage("nok-mock-products", products);
      return { success: true, product: mapProductImages(products[idx]) };
    }
    throw new Error("Product not found");
  },

  remove: async (id, token) => {
    await delay();
    const products = getProducts();
    const filtered = products.filter(p => p.id !== id);
    setLocalStorage("nok-mock-products", filtered);
    return { success: true };
  },

  addVariant: async (id, data, token) => {
    await delay();
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      const newV = { ...data, id: `v-${Date.now()}` };
      products[idx].variants = products[idx].variants || [];
      products[idx].variants.push(newV);
      setLocalStorage("nok-mock-products", products);
      return { success: true, variant: newV };
    }
    throw new Error("Product not found");
  },

  updateVariant: async (id, vid, data, token) => {
    await delay();
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      const vIdx = products[idx].variants.findIndex(v => v.id === vid);
      if (vIdx !== -1) {
        products[idx].variants[vIdx] = { ...products[idx].variants[vIdx], ...data };
        setLocalStorage("nok-mock-products", products);
        return { success: true, variant: products[idx].variants[vIdx] };
      }
    }
    throw new Error("Product or Variant not found");
  },

  deleteVariant: async (id, vid, token) => {
    await delay();
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx].variants = products[idx].variants.filter(v => v.id !== vid);
      setLocalStorage("nok-mock-products", products);
      return { success: true };
    }
    throw new Error("Product not found");
  },

  addImage: async (id, data, token) => {
    await delay();
    return { success: true, image: { id: `img-${Date.now()}`, imageUrl: comboImg, sortOrder: 1 } };
  },

  deleteImage: async (id, iid, token) => {
    await delay();
    return { success: true };
  }
};

// ═════════════════════════════════════════════════════════════════════
// CATEGORIES MOCK
// ═════════════════════════════════════════════════════════════════════
export const categoryApi = {
  list: async () => {
    await delay();
    return { success: true, categories: getCategories() };
  },
  bySlug: async (slug) => {
    await delay();
    const categories = getCategories();
    const category = categories.find(c => c.slug === slug);
    if (!category) throw new Error("Category not found");
    return { success: true, category };
  },
  create: async (data, token) => {
    await delay();
    const categories = getCategories();
    const newCat = {
      ...data,
      id: `cat-${Date.now()}`,
      slug: data.slug || (data.nameEn || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      isActive: true
    };
    categories.push(newCat);
    setLocalStorage("nok-mock-categories", categories);
    return { success: true, category: mapCategoryImage(newCat) };
  },
  update: async (id, data, token) => {
    await delay();
    const categories = getCategories();
    const idx = categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      categories[idx] = { ...categories[idx], ...data };
      setLocalStorage("nok-mock-categories", categories);
      return { success: true, category: mapCategoryImage(categories[idx]) };
    }
    throw new Error("Category not found");
  },
  remove: async (id, token) => {
    await delay();
    const categories = getCategories();
    const filtered = categories.filter(c => c.id !== id);
    setLocalStorage("nok-mock-categories", filtered);
    return { success: true };
  }
};

// ═════════════════════════════════════════════════════════════════════
// BANNERS — real API
// ═════════════════════════════════════════════════════════════════════
const BANNER_BASE = `${import.meta.env.VITE_LHOST_API_URL}/banners`;

async function apiFetch(url, options = {}, _retry = true) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error("Cannot connect to server — is the backend running?");
  }

  const text = await res.text();
  if (!text) throw new Error("Server returned empty response");
  let json;
  try { json = JSON.parse(text); } catch { throw new Error("Server returned invalid JSON"); }

  // Access token expired or invalid — try silent refresh once
  if ((res.status === 401 || res.status === 403) && _retry) {
    const { refreshToken, setAccessToken, logout } = useAuthStore.getState();
    if (refreshToken) {
      try {
        const rRes = await fetch(`${import.meta.env.VITE_LHOST_API_URL}/auth/refresh-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        const rJson = await rRes.json();
        if (rRes.ok && rJson.accessToken) {
          setAccessToken(rJson.accessToken);
          const retryOptions = {
            ...options,
            headers: { ...options.headers, Authorization: `Bearer ${rJson.accessToken}` },
          };
          return apiFetch(url, retryOptions, false);
        }
      } catch { /* refresh request itself failed */ }
    }
    // Could not refresh — force logout so user re-authenticates
    logout();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
  return json;
}

export const bannerApi = {
  // public — active banners only (Home page)
  active: () =>
    apiFetch(`${BANNER_BASE}/get-banners`),

  // admin — all banners including inactive
  all: (token) =>
    apiFetch(`${BANNER_BASE}/get-all`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // admin — create: { title, subtitle?, imageUrl?, videoUrl?, linkUrl?, sortOrder?, isActive? }
  create: (data, token) =>
    apiFetch(`${BANNER_BASE}/create-banner`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  // admin — update a banner; id travels in the body
  update: (id, data, token) =>
    apiFetch(`${BANNER_BASE}/update-banner`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...data, id }),
    }),

  // admin — delete a banner; id travels in the body
  remove: (id, token) =>
    apiFetch(`${BANNER_BASE}/delete-banner`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    }),
};

// ═════════════════════════════════════════════════════════════════════
// BTEXT — real API
// ═════════════════════════════════════════════════════════════════════
const BTEXT_BASE = `${import.meta.env.VITE_LHOST_API_URL}/btext`;

export const btextApi = {
  // public — overlays for a specific banner (used by HeroBanner)
  byBanner: (bannerId) =>
    apiFetch(`${BTEXT_BASE}/get-by-banner?bannerId=${bannerId}`),

  // admin — all btext entries
  all: (token) =>
    apiFetch(`${BTEXT_BASE}/get-all`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // admin — overlays for a specific banner; bannerId travels as query param
  forBanner: (bannerId, token) =>
    apiFetch(`${BTEXT_BASE}/get-for-banner?bannerId=${bannerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // admin — create: { bannerId, heading, subtext?, isActive? }
  create: (data, token) =>
    apiFetch(`${BTEXT_BASE}/create-btext`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  // admin — update an overlay; id travels in the body
  update: (id, data, token) =>
    apiFetch(`${BTEXT_BASE}/update-btext`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...data, id }),
    }),

  // admin — delete an overlay; id travels in the body
  remove: (id, token) =>
    apiFetch(`${BTEXT_BASE}/delete-btext`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    }),
};

// ═════════════════════════════════════════════════════════════════════
// ORDERS MOCK
// ═════════════════════════════════════════════════════════════════════
export const orderApi = {
  place: async (data, token) => {
    await delay();
    const orders = getOrders();
    const user = getCurrentUser(token);
    const orderId = `nok-${Math.floor(100000 + Math.random() * 900000)}`;
    const addressVal = data.shippingAddress || data.address;
    const newOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customerName: user.fullName || addressVal?.name || "Customer",
      customerPhone: user.phone || addressVal?.phone || "N/A",
      subtotal: data.subtotal,
      deliveryCharge: data.deliveryCharge || 0,
      discount: data.discount || 0,
      couponApplied: data.couponCode || null,
      total: data.total,
      status: "pending",
      paymentStatus: (data.paymentMethod === "COD" || data.paymentMethod === "upi") ? "pending" : "completed",
      paymentMethod: data.paymentMethod,
      address: addressVal,
      items: data.items.map(i => ({
        ...i,
        image: comboImg // Map to single image asset
      })),
      timeline: [
        { status: "pending", message: "Order placed successfully", time: new Date().toISOString() }
      ]
    };
    orders.unshift(newOrder);
    setLocalStorage("nok-mock-orders", orders);
    return { success: true, order: newOrder };
  },

  mine: async (token) => {
    await delay();
    return { success: true, orders: getOrders() };
  },

  byId: async (id, token) => {
    await delay();
    const orders = getOrders();
    const order = orders.find(o => o.id === id);
    if (!order) throw new Error("Order not found");
    return { success: true, order };
  },

  cancel: async (id, token) => {
    await delay();
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      orders[idx].status = "cancelled";
      orders[idx].timeline.push({
        status: "cancelled",
        message: "Order cancelled by customer",
        time: new Date().toISOString()
      });
      setLocalStorage("nok-mock-orders", orders);
      return { success: true, order: orders[idx] };
    }
    throw new Error("Order not found");
  },

  returnReq: async (id, data, token) => {
    await delay();
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      orders[idx].status = "returned";
      orders[idx].timeline.push({
        status: "returned",
        message: `Return requested: ${data.reason}`,
        time: new Date().toISOString()
      });
      setLocalStorage("nok-mock-orders", orders);
      return { success: true, order: orders[idx] };
    }
    throw new Error("Order not found");
  },

  submitUpiReference: async (id, upiRefId, token) => {
    await delay();
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error("Order not found");
    if (orders[idx].paymentStatus === "paid") {
      throw new Error("This order is already marked as paid");
    }
    orders[idx].timeline.push({
      status: "pending",
      message: `UPI Ref ID submitted by customer: ${upiRefId} — awaiting admin verification.`,
      time: new Date().toISOString(),
    });
    setLocalStorage("nok-mock-orders", orders);
    return { success: true, message: "UPI reference submitted. We'll verify your payment shortly." };
  },

  all: async (params = "", token) => {
    await delay();
    const orders = getOrders();
    return { success: true, orders, pagination: { total: orders.length, page: 1, limit: 50, totalPages: 1 } };
  },

  updateStatus: async (id, data, token) => {
    await delay();
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      orders[idx].status = data.status;
      if (data.deliveryDetails) {
        orders[idx].courierName = data.deliveryDetails.courierName;
        orders[idx].trackingNumber = data.deliveryDetails.trackingNumber;
      }
      orders[idx].timeline.push({
        status: data.status,
        message: `Order status updated to ${data.status}`,
        time: new Date().toISOString()
      });
      setLocalStorage("nok-mock-orders", orders);
      return { success: true, order: orders[idx] };
    }
    throw new Error("Order not found");
  }
};

// ═════════════════════════════════════════════════════════════════════
// CART MOCK
// ═════════════════════════════════════════════════════════════════════
export const cartApi = {
  get: async (token) => {
    await delay();
    return { success: true, cart: getCart() };
  },
  add: async (data, token) => {
    await delay();
    const cart = getCart();
    const products = getProducts();
    const product = products.find(p => p.id === data.productId || p.variants.some(v => v.id === data.variantId));
    const variant = product?.variants.find(v => v.id === data.variantId);
    
    if (variant) {
      const existingIdx = cart.items.findIndex(i => i.variantId === data.variantId);
      if (existingIdx !== -1) {
        cart.items[existingIdx].quantity += (data.quantity || 1);
      } else {
        cart.items.push({
          id: `cart-${Date.now()}`,
          variantId: data.variantId,
          weightLabel: variant.weightLabel,
          price: variant.price,
          comparePrice: variant.comparePrice,
          quantity: data.quantity || 1,
          product: {
            id: product.id,
            nameEn: product.nameEn,
            nameTa: product.nameTa,
            primaryImage: comboImg,
            slug: product.slug
          }
        });
      }
      setLocalStorage("nok-mock-cart", cart);
    }
    return { success: true, cart };
  },
  update: async (itemId, data, token) => {
    await delay();
    const cart = getCart();
    const idx = cart.items.findIndex(i => i.variantId === itemId || i.id === itemId);
    if (idx !== -1) {
      cart.items[idx].quantity = data.quantity;
      setLocalStorage("nok-mock-cart", cart);
    }
    return { success: true, cart };
  },
  remove: async (itemId, token) => {
    await delay();
    const cart = getCart();
    cart.items = cart.items.filter(i => i.variantId !== itemId && i.id !== itemId);
    setLocalStorage("nok-mock-cart", cart);
    return { success: true, cart };
  },
  clear: async (token) => {
    await delay();
    const cart = { items: [] };
    setLocalStorage("nok-mock-cart", cart);
    return { success: true, cart };
  }
};

// ═════════════════════════════════════════════════════════════════════
// WISHLIST MOCK
// ═════════════════════════════════════════════════════════════════════
export const wishlistApi = {
  get: async (token) => {
    await delay();
    return { success: true, wishlist: getWishlist() };
  },
  toggle: async (data, token) => {
    await delay();
    const wishlist = getWishlist();
    const products = getProducts();
    const product = products.find(p => p.id === data.productId);
    
    if (product) {
      const idx = wishlist.items.findIndex(i => i.productId === data.productId);
      if (idx !== -1) {
        wishlist.items.splice(idx, 1);
      } else {
        wishlist.items.push({
          productId: product.id,
          product: {
            id: product.id,
            nameEn: product.nameEn,
            nameTa: product.nameTa,
            slug: product.slug,
            primaryImage: comboImg,
            minPrice: product.minPrice,
            minComparePrice: product.minComparePrice
          }
        });
      }
      setLocalStorage("nok-mock-wishlist", wishlist);
    }
    return { success: true, wishlist };
  },
  remove: async (pid, token) => {
    await delay();
    const wishlist = getWishlist();
    wishlist.items = wishlist.items.filter(i => i.productId !== pid);
    setLocalStorage("nok-mock-wishlist", wishlist);
    return { success: true, wishlist };
  }
};

// ═════════════════════════════════════════════════════════════════════
// COUPONS MOCK
// ═════════════════════════════════════════════════════════════════════
export const couponApi = {
  validate: async (data, token) => {
    await delay();
    const offers = getOffers();
    const coupon = offers.find(o => o.code === data.code && o.isActive);
    if (!coupon) throw new Error("Invalid coupon code");
    
    if (data.subtotal < coupon.minOrderValue) {
      throw new Error(`Minimum order value of ₹${coupon.minOrderValue} required`);
    }

    const discountAmount = coupon.offerType === "percentage" 
      ? Math.round((data.subtotal * coupon.value) / 100)
      : coupon.value;

    return {
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.offerType,
        discountValue: coupon.value,
        discountAmount
      }
    };
  },
  all: async (token) => {
    await delay();
    return { success: true, coupons: getOffers() };
  },
  create: async (data, token) => {
    await delay();
    const offers = getOffers();
    const newOffer = { ...data, id: `off-${Date.now()}`, isActive: true };
    offers.push(newOffer);
    setLocalStorage("nok-mock-offers", offers);
    return { success: true, coupon: newOffer };
  },
  update: async (id, data, token) => {
    await delay();
    const offers = getOffers();
    const idx = offers.findIndex(o => o.id === id);
    if (idx !== -1) {
      offers[idx] = { ...offers[idx], ...data };
      setLocalStorage("nok-mock-offers", offers);
      return { success: true, coupon: offers[idx] };
    }
    throw new Error("Coupon not found");
  },
  remove: async (id, token) => {
    await delay();
    const offers = getOffers();
    const filtered = offers.filter(o => o.id !== id);
    setLocalStorage("nok-mock-offers", filtered);
    return { success: true };
  }
};

// ═════════════════════════════════════════════════════════════════════
// OFFERS MOCK
// ═════════════════════════════════════════════════════════════════════
export const offerApi = {
  active: async () => {
    await delay();
    return { success: true, offers: getOffers().filter(o => o.isActive) };
  },
  all: async (token) => {
    await delay();
    return { success: true, offers: getOffers() };
  },
  create: async (data, token) => {
    await delay();
    return couponApi.create(data, token);
  },
  update: async (id, data, token) => {
    await delay();
    return couponApi.update(id, data, token);
  },
  remove: async (id, token) => {
    await delay();
    return couponApi.remove(id, token);
  }
};

// ═════════════════════════════════════════════════════════════════════
// USERS
// ═════════════════════════════════════════════════════════════════════
const USER_BASE = `${import.meta.env.VITE_LHOST_API_URL}/users`;

export const userApi = {
  me: async (token) => {
    await delay();
    return { success: true, user: getCurrentUser(token) };
  },
  updateMe: async (data, token) => {
    await delay();
    const users = getUsers();
    const currentUser = getCurrentUser(token);
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      setLocalStorage("nok-mock-users", users);
      return { success: true, user: users[idx] };
    }
    throw new Error("User not found");
  },
  changePassword: async (data, token) => {
    await delay();
    return { success: true, message: "Password updated successfully" };
  },
  addresses: async (token) => {
    await delay();
    const user = getCurrentUser(token);
    const mockAddr = getLocalStorage(`nok-mock-addresses-${user.id}`, [
      { id: "addr-1", fullName: user.fullName, phone: user.phone, addressLine1: "15, Coastal Road", addressLine2: "Near Light House", city: "Rameswaram", state: "Tamil Nadu", pincode: "623526", isDefault: true }
    ]);
    return { success: true, addresses: mockAddr };
  },
  addAddress: async (data, token) => {
    await delay();
    const user = getCurrentUser(token);
    const mockAddr = getLocalStorage(`nok-mock-addresses-${user.id}`, []);
    const newAddr = { ...data, id: `addr-${Date.now()}` };
    if (newAddr.isDefault) {
      mockAddr.forEach(a => a.isDefault = false);
    }
    mockAddr.push(newAddr);
    setLocalStorage(`nok-mock-addresses-${user.id}`, mockAddr);
    return { success: true, address: newAddr };
  },
  updateAddress: async (id, data, token) => {
    await delay();
    const user = getCurrentUser(token);
    const mockAddr = getLocalStorage(`nok-mock-addresses-${user.id}`, []);
    const idx = mockAddr.findIndex(a => a.id === id);
    if (idx !== -1) {
      mockAddr[idx] = { ...mockAddr[idx], ...data };
      if (data.isDefault) {
        mockAddr.forEach((a, i) => { if (i !== idx) a.isDefault = false; });
      }
      setLocalStorage(`nok-mock-addresses-${user.id}`, mockAddr);
      return { success: true, address: mockAddr[idx] };
    }
    throw new Error("Address not found");
  },
  deleteAddress: async (id, token) => {
    await delay();
    const user = getCurrentUser(token);
    let mockAddr = getLocalStorage(`nok-mock-addresses-${user.id}`, []);
    mockAddr = mockAddr.filter(a => a.id !== id);
    setLocalStorage(`nok-mock-addresses-${user.id}`, mockAddr);
    return { success: true };
  },
  all: (params = "", token) =>
    apiFetch(`${USER_BASE}/get-all?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  // id travels in the body for all mutating admin user calls
  block: (id, token) =>
    apiFetch(`${USER_BASE}/toggle-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status: "blocked" })
    }),
  unblock: (id, token) =>
    apiFetch(`${USER_BASE}/toggle-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status: "active" })
    }),
  remove: (id, token) =>
    apiFetch(`${USER_BASE}/delete-user`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id })
    })
};

// ═════════════════════════════════════════════════════════════════════
// INVENTORY MOCK
// ═════════════════════════════════════════════════════════════════════
export const inventoryApi = {
  list: async (params = "", token) => {
    await delay();
    const products = getProducts();
    const inventoryList = [];
    products.forEach(p => {
      p.variants.forEach(v => {
        inventoryList.push({
          variantId: v.id,
          weightLabel: v.weightLabel,
          weightGrams: v.weightGrams,
          price: v.price,
          comparePrice: v.comparePrice,
          stockQty: v.stockQty,
          productName: p.nameEn,
          productId: p.id,
          categoryName: p.categoryName,
          primaryImage: comboImg
        });
      });
    });
    return { success: true, inventory: inventoryList, pagination: { total: inventoryList.length, page: 1, limit: 100 } };
  },
  update: async (variantId, data, token) => {
    await delay();
    const products = getProducts();
    let found = false;
    products.forEach((p, pIdx) => {
      p.variants.forEach((v, vIdx) => {
        if (v.id === variantId) {
          products[pIdx].variants[vIdx] = { ...v, ...data };
          found = true;
        }
      });
    });
    if (found) {
      setLocalStorage("nok-mock-products", products);
      return { success: true };
    }
    throw new Error("Inventory item not found");
  }
};

// ═════════════════════════════════════════════════════════════════════
// DASHBOARD MOCK
// ═════════════════════════════════════════════════════════════════════
export const dashboardApi = {
  kpis: async (token) => {
    await delay();
    const orders = getOrders().filter(o => o.status !== "cancelled");
    const products = getProducts();
    const users = getUsers();
    const totalRevenue = orders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalOrders = orders.length;
    const totalUsers = users.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    return {
      success: true,
      kpis: {
        totalRevenue,
        totalOrders,
        totalUsers,
        avgOrderValue,
        activeProductsCount: products.length
      }
    };
  },
  charts: async (token) => {
    await delay();
    return {
      success: true,
      charts: {
        salesTrend: [
          { date: "Mon", sales: 1200 },
          { date: "Tue", sales: 1900 },
          { date: "Wed", sales: 1500 },
          { date: "Thu", sales: 2200 },
          { date: "Fri", sales: 3000 },
          { date: "Sat", sales: 4500 },
          { date: "Sun", sales: 3800 }
        ],
        categoryDistribution: [
          { name: "Nethili", value: 40 },
          { name: "Sura", value: 30 },
          { name: "Kingfish", value: 15 },
          { name: "Pickles", value: 15 }
        ]
      }
    };
  },
  reports: async (params = "", token) => {
    await delay();
    return {
      success: true,
      report: [
        { id: "rep-1", type: "sales", title: "Monthly Sales Report", date: "2026-06-01" },
        { id: "rep-2", type: "inventory", title: "Out of Stock Report", date: "2026-06-15" }
      ]
    };
  }
};

// ═════════════════════════════════════════════════════════════════════
// SETTINGS MOCK
// ═════════════════════════════════════════════════════════════════════
export const settingsApi = {
  get: async () => {
    await delay();
    return { success: true, settings: getSettings() };
  },
  update: async (data, token) => {
    await delay();
    setLocalStorage("nok-mock-settings", data);
    return { success: true, settings: data };
  }
};

// ── Payment Settings Mock ───────────────────────────────────────────
const getPaymentSettings = () => getLocalStorage("nok-mock-payment-settings", {
  upiId: "nammaoor@upi",
  payeeName: "Namma Oor Karuvattu Kadai",
  accountHolderName: "Namma Oor Store",
  accountNumber: "123456789012",
  ifscCode: "SBIN0001234",
  bankName: "State Bank of India",
  qrCodeUrl: ""
});

export const paymentSettingsApi = {
  getPublic: async () => {
    await delay();
    const settings = getPaymentSettings();
    // Return only public UPI receiving details
    return {
      success: true,
      settings: {
        upiId: settings.upiId,
        payeeName: settings.payeeName,
        qrCodeUrl: settings.qrCodeUrl,
      }
    };
  },
  getAdmin: async (token) => {
    await delay();
    return { success: true, settings: getPaymentSettings() };
  },
  update: async (data, token) => {
    await delay();
    const current = getPaymentSettings();
    const updated = { ...current, ...data };
    setLocalStorage("nok-mock-payment-settings", updated);
    return { success: true, settings: updated };
  },
  uploadQr: async (file, token) => {
    await delay();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const settings = getPaymentSettings();
        settings.qrCodeUrl = reader.result;
        setLocalStorage("nok-mock-payment-settings", settings);
        resolve({ success: true, settings });
      };
      reader.onerror = () => {
        reject(new Error("Failed to read QR file"));
      };
      reader.readAsDataURL(file);
    });
  }
};