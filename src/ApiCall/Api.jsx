// ─────────────────────────────────────────────────────────────────────
// src/ApiCall/Api.jsx
//
// .env variable:
//   VITE_API_URL=http://localhost:5000/api        ← local dev
//   VITE_API_URL=https://api.yourdomain.com/api   ← production
//
// Create src/.env with:
//   VITE_API_URL=http://localhost:5000/api
// ─────────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Core fetcher ───────────────────────────────────────────────────────
async function call(method, path, body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!res.ok) {
    const err = new Error(json.message || "Request failed");
    err.status = res.status;
    err.data   = json;
    throw err;
  }

  return json;
}

// ── HTTP helpers ───────────────────────────────────────────────────────
const get   = (path, token)       => call("GET",    path, null, token);
const post  = (path, body, token) => call("POST",   path, body, token);
const put   = (path, body, token) => call("PUT",    path, body, token);
const patch = (path, body, token) => call("PATCH",  path, body, token);
const del   = (path, token)       => call("DELETE", path, null, token);

// ═════════════════════════════════════════════════════════════════════
// AUTH  /api/auth
// res: { success, user, token }
// ═════════════════════════════════════════════════════════════════════
export const authApi = {
  login:    (data)        => post("/auth/login",    data),
  register: (data)        => post("/auth/register", data),
  sendOtp:  (data)        => post("/auth/send-otp", data),
  logout:   (token)       => post("/auth/logout",   {}, token),
  refresh:  (token)       => post("/auth/refresh",  {}, token),
};

// ═════════════════════════════════════════════════════════════════════
// PRODUCTS  /api/products
//
// List  res: { success, products[], pagination }
// Single res: { success, product }
//
// product: id, nameEn, nameTa, slug, description, howToUse, storageTips,
//          categoryId, categoryName, categorySlug,
//          isBestseller, isNew, isActive, inStock,
//          minPrice, minComparePrice, totalStock,
//          avgRating, reviewCount, primaryImage,
//          variants[], images[], reviews[]
//
// variant: id, weightGrams, weightLabel, price, comparePrice, stockQty
// image:   id, imageUrl, sortOrder, isPrimary
// review:  id, userId, userName, rating, title, comment,
//          isVerified, createdAt
// ═════════════════════════════════════════════════════════════════════
export const productApi = {
  list:    (params = "")         => get(`/products?${params}`),
  bySlug:  (slug)                => get(`/products/${slug}`),
  addReview:(id, data, token)    => post(`/products/${id}/reviews`,         data, token),
  deleteReview:(id, rId, token)  => del(`/products/${id}/reviews/${rId}`,         token),

  // Admin
  create:  (data, token)         => post("/products",                       data, token),
  update:  (id, data, token)     => put(`/products/${id}`,                  data, token),
  remove:  (id, token)           => del(`/products/${id}`,                        token),

  addVariant:   (id, data, token)      => post(`/products/${id}/variants`,           data, token),
  updateVariant:(id, vid, data, token) => put(`/products/${id}/variants/${vid}`,     data, token),
  deleteVariant:(id, vid, token)       => del(`/products/${id}/variants/${vid}`,           token),

  addImage:    (id, data, token)  => post(`/products/${id}/images`,         data, token),
  deleteImage: (id, iid, token)   => del(`/products/${id}/images/${iid}`,         token),
};

// ═════════════════════════════════════════════════════════════════════
// CATEGORIES  /api/categories
// res: { success, categories[] }
// category: id, nameEn, nameTa, label, slug, imageUrl, sortOrder, isActive
// ═════════════════════════════════════════════════════════════════════
export const categoryApi = {
  list:   ()                 => get("/categories"),
  bySlug: (slug)             => get(`/categories/${slug}`),

  // Admin
  create: (data, token)      => post("/categories",        data, token),
  update: (id, data, token)  => put(`/categories/${id}`,   data, token),
  remove: (id, token)        => del(`/categories/${id}`,         token),
};

// ═════════════════════════════════════════════════════════════════════
// BANNERS  /api/banners
// res: { success, banners[] }
// banner: id, title, subtitle, imageUrl, linkUrl, sortOrder, isActive
// ═════════════════════════════════════════════════════════════════════
export const bannerApi = {
  active: ()                => get("/banners"),

  // Admin
  all:    (token)           => get("/banners/all",          token),
  create: (data, token)     => post("/banners",       data, token),
  update: (id, data, token) => put(`/banners/${id}`,  data, token),
  remove: (id, token)       => del(`/banners/${id}`,        token),
};

// ═════════════════════════════════════════════════════════════════════
// ORDERS  /api/orders
// res: { success, order } / { success, orders[], pagination }
//
// order: id, createdAt, customerName, customerPhone,
//        subtotal, deliveryCharge, discount, couponApplied, total,
//        status, paymentStatus, paymentMethod,
//        courierName, trackingNumber, trackingUrl,
//        address{ addressLine1, addressLine2, city, state, pincode },
//        items[], timeline[]
// ═════════════════════════════════════════════════════════════════════
export const orderApi = {
  place:     (data, token)          => post("/orders",                data, token),
  mine:      (token)                => get("/orders/my-orders",             token),
  byId:      (id, token)            => get(`/orders/${id}`,                 token),
  cancel:    (id, token)            => patch(`/orders/${id}/cancel`,  {},   token),
  returnReq: (id, data, token)      => post(`/orders/${id}/return`,   data, token),

  // Admin
  all:          (params = "", token) => get(`/orders?${params}`,            token),
  updateStatus: (id, data, token)    => patch(`/orders/${id}/status`, data, token),
};

// ═════════════════════════════════════════════════════════════════════
// CART  /api/cart
// res: { success, cart: { id, items[] } }
// item: { id, variantId, weightLabel, price, comparePrice,
//         quantity, product{ id, nameEn, nameTa, primaryImage, slug } }
// ═════════════════════════════════════════════════════════════════════
export const cartApi = {
  get:    (token)                  => get("/cart",                  token),
  add:    (data, token)            => post("/cart",          data,  token),
  update: (itemId, data, token)    => patch(`/cart/${itemId}`, data, token),
  remove: (itemId, token)          => del(`/cart/${itemId}`,        token),
  clear:  (token)                  => del("/cart",                  token),
};

// ═════════════════════════════════════════════════════════════════════
// WISHLIST  /api/wishlist
// res: { success, wishlist: { items[] } }
// item: { productId, product{ id, nameEn, slug, primaryImage, ... } }
// ═════════════════════════════════════════════════════════════════════
export const wishlistApi = {
  get:    (token)             => get("/wishlist",           token),
  toggle: (data, token)       => post("/wishlist",   data,  token),  // { productId }
  remove: (pid, token)        => del(`/wishlist/${pid}`,    token),
};

// ═════════════════════════════════════════════════════════════════════
// COUPONS  /api/coupons
// res: { success, coupon{ code, discountType, discountValue,
//                         discountAmount, minOrderValue } }
// ═════════════════════════════════════════════════════════════════════
export const couponApi = {
  validate: (data, token)        => post("/coupons/validate", data, token),

  // Admin
  all:    (token)                => get("/coupons",                  token),
  create: (data, token)          => post("/coupons",          data,  token),
  update: (id, data, token)      => put(`/coupons/${id}`,     data,  token),
  remove: (id, token)            => del(`/coupons/${id}`,            token),
};

// ═════════════════════════════════════════════════════════════════════
// OFFERS  /api/offers
// res: { success, offers[] }
// offer: id, title, description, imageUrl, offerType, value,
//        code, minOrderValue, isActive, startDate, endDate
// ═════════════════════════════════════════════════════════════════════
export const offerApi = {
  active: ()                    => get("/offers/active"),

  // Admin
  all:    (token)               => get("/offers",                token),
  create: (data, token)         => post("/offers",        data,  token),
  update: (id, data, token)     => put(`/offers/${id}`,   data,  token),
  remove: (id, token)           => del(`/offers/${id}`,          token),
};

// ═════════════════════════════════════════════════════════════════════
// USERS  /api/users
// res: { success, user }
// user: id, fullName, email, phone, avatarUrl, role, status,
//       emailVerified, phoneVerified, createdAt
// ═════════════════════════════════════════════════════════════════════
export const userApi = {
  me:             (token)              => get("/users/me",                     token),
  updateMe:       (data, token)        => put("/users/me",             data,   token),
  changePassword: (data, token)        => put("/users/me/password",    data,   token),

  addresses:      (token)              => get("/users/me/addresses",           token),
  addAddress:     (data, token)        => post("/users/me/addresses",  data,   token),
  updateAddress:  (id, data, token)    => put(`/users/me/addresses/${id}`, data, token),
  deleteAddress:  (id, token)          => del(`/users/me/addresses/${id}`,     token),

  // Admin
  all:     (params = "", token)        => get(`/users?${params}`,              token),
  block:   (id, token)                 => patch(`/users/${id}/block`,   {},    token),
  unblock: (id, token)                 => patch(`/users/${id}/unblock`, {},    token),
};

// ═════════════════════════════════════════════════════════════════════
// INVENTORY  /api/inventory
// res: { success, inventory[], pagination }
// item: variantId, weightLabel, weightGrams, price, comparePrice,
//       stockQty, productName, categoryName, primaryImage
// ═════════════════════════════════════════════════════════════════════
export const inventoryApi = {
  list:   (params = "", token)     => get(`/inventory?${params}`,        token),
  update: (variantId, data, token) => patch(`/inventory/${variantId}`, data, token),
};

// ═════════════════════════════════════════════════════════════════════
// DASHBOARD  /api/dashboard
// res: { success, kpis{} / charts{} / report{} }
// ═════════════════════════════════════════════════════════════════════
export const dashboardApi = {
  kpis:    (token)               => get("/dashboard/kpis",               token),
  charts:  (token)               => get("/dashboard/charts",             token),
  reports: (params = "", token)  => get(`/dashboard/reports?${params}`,  token),
};

// ═════════════════════════════════════════════════════════════════════
// SETTINGS  /api/settings
// res: { success, settings{ storeName, storeEmail, storePhone,
//                            freeShippingThreshold, shippingCharge,
//                            gstPercentage } }
// ═════════════════════════════════════════════════════════════════════
export const settingsApi = {
  get:    ()              => get("/settings"),
  update: (data, token)   => put("/settings", data, token),
};