// Mock Database for NammaOorKaruvattuKadai
const INITIAL_CATEGORIES = [
  { id: 'dry-fish', nameEn: 'Dry Fish', nameTa: 'கருவாடு', image: '/assets/categories/dry-fish.jpg', slug: 'dry-fish' },
  { id: 'pickles', nameEn: 'Pickles', nameTa: 'ஊறுகாய்', image: '/assets/categories/pickles.jpg', slug: 'pickles' },
  { id: 'prawns', nameEn: 'Prawns & Shrimp', nameTa: 'இறால்', image: '/assets/categories/prawns.jpg', slug: 'prawns' },
  { id: 'masalas', nameEn: 'Masalas', nameTa: 'மசாலாக்கள்', image: '/assets/categories/masalas.jpg', slug: 'masalas' },
  { id: 'combos', nameEn: 'Combos', nameTa: 'கூட்டுத் தொகுப்புகள்', image: '/assets/categories/combos.jpg', slug: 'combos' }
];

const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    nameEn: 'Nethili Karuvadu (Anchovy)',
    nameTa: 'நெத்திலி கருவாடு',
    slug: 'nethili-karuvadu',
    category: 'dry-fish',
    description: 'Traditionally sun-dried premium Anchovy fish. Highly nutritious, clean, and sourced directly from Rameswaram fishermen. Excellent for dry fish gravy and deep fry.',
    howToUse: 'Soak in warm water for 10 minutes, wash 2-3 times to remove excess salt, then cook in gravies or fry.',
    storageTips: 'Store in an airtight container in a cool, dry place. Refrigiration extends shelf life up to 6 months.',
    rating: 4.8,
    reviewsCount: 124,
    image: '/assets/products/nethili.jpg',
    images: ['/assets/products/nethili.jpg', '/assets/products/nethili_detail1.jpg', '/assets/products/nethili_detail2.jpg'],
    isBestseller: true,
    isNew: false,
    discountPercent: 10,
    inStock: true,
    variants: [
      { weight: '250g', price: 180, mrp: 200, stock: 45 },
      { weight: '500g', price: 340, mrp: 400, stock: 30 },
      { weight: '1kg', price: 650, mrp: 800, stock: 15 }
    ]
  },
  {
    id: 'prod-2',
    nameEn: 'Sura Karuvadu (Shark Dry Fish)',
    nameTa: 'சுறா கருவாடு',
    slug: 'sura-karuvadu',
    category: 'dry-fish',
    description: 'Cleaned, salted, and perfectly dried Shark fish chunks. Famously used to make "Sura Karuvadu Puttu". Known for its rich traditional taste and health benefits.',
    howToUse: 'Boil in water for 5 minutes, scrape off any rough skin, shred into tiny pieces, and fry with small onions and green chilies.',
    storageTips: 'Store in a dry glass jar. Keep away from moisture.',
    rating: 4.9,
    reviewsCount: 88,
    image: '/assets/products/sura.jpg',
    images: ['/assets/products/sura.jpg'],
    isBestseller: true,
    isNew: true,
    discountPercent: 0,
    inStock: true,
    variants: [
      { weight: '250g', price: 220, mrp: 220, stock: 25 },
      { weight: '500g', price: 420, mrp: 440, stock: 18 },
      { weight: '1kg', price: 800, mrp: 880, stock: 8 }
    ]
  },
  {
    id: 'prod-3',
    nameEn: 'Kavalai Karuvadu (Sardine)',
    nameTa: 'கவலை கருவாடு',
    slug: 'kavalai-karuvadu',
    category: 'dry-fish',
    description: 'Sardines sun-dried in the traditional coastal style. Sourced from the Tuticorin coast. Packed with Omega-3 fatty acids and deep Tamil coastal flavor.',
    howToUse: 'Wash thoroughly in cold water. Fry with mustard, curry leaves, and red chilies, or add to tangy tamarind gravy.',
    storageTips: 'Avoid damp places. Airing out under the sun for an hour once a month is recommended for long storage.',
    rating: 4.5,
    reviewsCount: 42,
    image: '/assets/products/kavalai.jpg',
    images: ['/assets/products/kavalai.jpg'],
    isBestseller: false,
    isNew: false,
    discountPercent: 15,
    inStock: true,
    variants: [
      { weight: '250g', price: 120, mrp: 140, stock: 50 },
      { weight: '500g', price: 220, mrp: 280, stock: 40 },
      { weight: '1kg', price: 400, mrp: 560, stock: 20 }
    ]
  },
  {
    id: 'prod-4',
    nameEn: 'Premium Karuvadu Thokku (Pickle)',
    nameTa: 'காரசாரமான கருவாடு தொக்கு',
    slug: 'karuvadu-thokku',
    category: 'pickles',
    description: 'A spicy, traditional dry fish pickle prepared with cold-pressed sesame oil, homemade masalas, and shredded boneless dry fish. A perfect side dish for hot curd rice.',
    howToUse: 'Ready to eat. Use a dry spoon only. Mix with hot rice or eat as a side dish for idli, dosa, or curd rice.',
    storageTips: 'Keep in refrigerator after opening. Sits well for up to 3 months.',
    rating: 4.7,
    reviewsCount: 165,
    image: '/assets/products/thokku.jpg',
    images: ['/assets/products/thokku.jpg'],
    isBestseller: true,
    isNew: false,
    discountPercent: 5,
    inStock: true,
    variants: [
      { weight: '250g', price: 190, mrp: 200, stock: 60 },
      { weight: '500g', price: 360, mrp: 400, stock: 35 }
    ]
  },
  {
    id: 'prod-5',
    nameEn: 'Spicy Prawn Pickle',
    nameTa: 'காரசாரமான இறால் ஊறுகாய்',
    slug: 'prawn-pickle',
    category: 'pickles',
    description: 'Made using fresh prawns fried to perfection and blended with robust coastal spices and gingelly oil. Authentic village taste that will leave you wanting more.',
    howToUse: 'Directly consume as an accompaniment with meals.',
    storageTips: 'Keep lid tightly closed. Store in a cool place.',
    rating: 4.6,
    reviewsCount: 95,
    image: '/assets/products/prawn-pickle.jpg',
    images: ['/assets/products/prawn-pickle.jpg'],
    isBestseller: false,
    isNew: true,
    discountPercent: 0,
    inStock: true,
    variants: [
      { weight: '250g', price: 250, mrp: 250, stock: 40 },
      { weight: '500g', price: 480, mrp: 500, stock: 20 }
    ]
  },
  {
    id: 'prod-6',
    nameEn: 'Sun-Dried Prawns (Ular Eral)',
    nameTa: 'உலர் இறால் (கருவாடு)',
    slug: 'ular-eral',
    category: 'prawns',
    description: 'Shelled and sun-dried prawns. Clean, sand-free, and natural. Adds a burst of umami flavor to your gravies, rice, and stir-frys.',
    howToUse: 'Rinse in cold water. Add directly to gravies, masalas, or fry with onions.',
    storageTips: 'Store in air-tight container in freezer for best results.',
    rating: 4.8,
    reviewsCount: 110,
    image: '/assets/products/dry-prawns.jpg',
    images: ['/assets/products/dry-prawns.jpg'],
    isBestseller: true,
    isNew: false,
    discountPercent: 12,
    inStock: true,
    variants: [
      { weight: '250g', price: 230, mrp: 260, stock: 30 },
      { weight: '500g', price: 430, mrp: 520, stock: 15 }
    ]
  },
  {
    id: 'prod-7',
    nameEn: 'Traditional Fish Fry Masala',
    nameTa: 'மீன் வறுவல் மசாலா',
    slug: 'fish-fry-masala',
    category: 'masalas',
    description: 'Sourced from coastal villages. A stone-ground, aromatic blend of red chilies, coriander, cumin, pepper, and traditional spices. Gives the authentic fish fry flavor.',
    howToUse: 'Mix 2 tbsp masala with lemon juice/water and salt, coat fish pieces, marinate for 20 mins, and shallow fry.',
    storageTips: 'Keep in dry container. Avoid wet hands.',
    rating: 4.4,
    reviewsCount: 54,
    image: '/assets/products/masala.jpg',
    images: ['/assets/products/masala.jpg'],
    isBestseller: false,
    isNew: false,
    discountPercent: 0,
    inStock: true,
    variants: [
      { weight: '250g', price: 85, mrp: 85, stock: 100 },
      { weight: '500g', price: 160, mrp: 170, stock: 60 }
    ]
  },
  {
    id: 'prod-8',
    nameEn: 'Village Special Karuvadu Combo',
    nameTa: 'கிராமத்து ஸ்பெஷல் கருவாடு காம்போ',
    slug: 'village-combo',
    category: 'combos',
    description: 'A handpicked dry fish bundle for true seafood lovers. Contains: Nethili Karuvadu (250g) + Sura Karuvadu (250g) + Dry Prawns (250g). Sourced fresh, packed hygiene.',
    howToUse: 'Process individual packs as per their respective cooking instructions.',
    storageTips: 'Store in cool dry place or refrigerate individually.',
    rating: 4.9,
    reviewsCount: 77,
    image: '/assets/products/combo.jpg',
    images: ['/assets/products/combo.jpg'],
    isBestseller: true,
    isNew: false,
    discountPercent: 20,
    inStock: true,
    variants: [
      { weight: '1kg', price: 499, mrp: 625, stock: 25 }
    ]
  },
  {
    id: 'prod-9',
    nameEn: 'Seela Karuvadu (Kingfish Dry Fish)',
    nameTa: 'சீலா கருவாடு',
    slug: 'seela-karuvadu',
    category: 'dry-fish',
    description: 'Premium Kingfish (Seela/Vanjaram) dry fish slices. Thick chunks, very meaty, and minimal bones. Sourced from Cuddalore harbor. Perfect for making traditional fish curry.',
    howToUse: 'Soak in warm water for 15 minutes, scrub slightly, wash and drop directly into simmering curry.',
    storageTips: 'Store in freezer inside an airtight plastic zip lock.',
    rating: 4.9,
    reviewsCount: 143,
    image: '/assets/products/seela.jpg',
    images: ['/assets/products/seela.jpg'],
    isBestseller: true,
    isNew: false,
    discountPercent: 0,
    inStock: false,
    variants: [
      { weight: '250g', price: 320, mrp: 320, stock: 0 },
      { weight: '500g', price: 600, mrp: 600, stock: 0 }
    ]
  },
  {
    id: 'prod-10',
    nameEn: 'Kanava Karuvadu (Dry Squid)',
    nameTa: 'கணவா கருவாடு',
    slug: 'kanava-karuvadu',
    category: 'dry-fish',
    description: 'Cleaned and flat-dried whole squids. Sourced from coastal Ramanathapuram. Highly popular for its chewy, rich seafood flavor when roasted or fried with chilies.',
    howToUse: 'Wash, cut into small rings, soak in hot water, and stir fry with onions, garlic, and cracked black pepper.',
    storageTips: 'Keep in dry airtight jar. Avoid heat and moisture.',
    rating: 4.3,
    reviewsCount: 31,
    image: '/assets/products/squid.jpg',
    images: ['/assets/products/squid.jpg'],
    isBestseller: false,
    isNew: true,
    discountPercent: 5,
    inStock: true,
    variants: [
      { weight: '250g', price: 260, mrp: 275, stock: 15 },
      { weight: '500g', price: 500, mrp: 550, stock: 10 }
    ]
  }
];

const INITIAL_COUPONS = [
  { code: 'KARUVADU10', discountPercent: 10, minOrder: 500, maxUses: 100, expiry: '2026-12-31', usageCount: 14, description: '10% OFF on orders above ₹500' },
  { code: 'WELCOME50', discountPercent: 0, discountFlat: 50, minOrder: 300, maxUses: 500, expiry: '2026-09-30', usageCount: 88, description: 'Flat ₹50 OFF on orders above ₹300' },
  { code: 'FREESHIP', discountPercent: 0, discountFlat: 0, freeShipping: true, minOrder: 400, maxUses: 1000, expiry: '2026-12-31', usageCount: 204, description: 'Free Delivery on orders above ₹400' }
];

const INITIAL_BANNERS = [
  { id: 1, title: 'சுத்தமான கிராமத்து கருவாடு', subtitle: 'Sun-dried. No chemical preservatives. Sourced direct from coastal Tamil Nadu villages.', image: '/assets/banners/hero-banner.jpg', link: '/products', sortOrder: 1, active: true },
  { id: 2, title: 'ஆடி மாச ஸ்பெஷல் சலுகை', subtitle: 'Flat 10% OFF on all pickles and thokku items. Use code KARUVADU10.', image: '/assets/banners/offer-banner.jpg', link: '/products?category=pickles', sortOrder: 2, active: true },
  { id: 3, title: 'இறக்குமதி இல்லாத நேரடி கொள்முதல்', subtitle: 'Sourced directly from our traditional fishermen community. Savor the authentic taste.', image: '/assets/banners/fisherman-banner.jpg', link: '/products', sortOrder: 3, active: true }
];

const INITIAL_ORDERS = [
  {
    id: 'ORD-9874',
    date: '2026-06-12T14:32:00Z',
    customerName: 'Anbarasan M',
    customerEmail: 'customer@gmail.com',
    customerPhone: '9876543210',
    items: [
      { productId: 'prod-1', nameEn: 'Nethili Karuvadu (Anchovy)', nameTa: 'நெத்திலி கருவாடு', weight: '250g', price: 180, quantity: 2, image: '/assets/products/nethili.jpg' },
      { productId: 'prod-4', nameEn: 'Premium Karuvadu Thokku (Pickle)', nameTa: 'காரசாரமான கருவாடு தொக்கு', weight: '250g', price: 190, quantity: 1, image: '/assets/products/thokku.jpg' }
    ],
    subtotal: 550,
    deliveryCharge: 0,
    discount: 55, // KARUVADU10 applied
    couponApplied: 'KARUVADU10',
    total: 495,
    status: 'Processing', // Processing | Shipped | Delivered | Cancelled
    paymentMethod: 'UPI (GPay)',
    paymentStatus: 'Paid',
    address: {
      fullName: 'Anbarasan M',
      phone: '9876543210',
      doorNo: '14/3, East Coast Road',
      street: 'Thiruvanmiyur',
      city: 'Chennai',
      pincode: '600041',
      state: 'Tamil Nadu'
    }
  },
  {
    id: 'ORD-9532',
    date: '2026-06-08T10:15:00Z',
    customerName: 'Deepak Kumar',
    customerEmail: 'deepak@gmail.com',
    customerPhone: '9944332211',
    items: [
      { productId: 'prod-2', nameEn: 'Sura Karuvadu (Shark Dry Fish)', nameTa: 'சுறா கருவாடு', weight: '500g', price: 420, quantity: 1, image: '/assets/products/sura.jpg' }
    ],
    subtotal: 420,
    deliveryCharge: 50,
    discount: 0,
    total: 470,
    status: 'Delivered',
    paymentMethod: 'Cash on Delivery (COD)',
    paymentStatus: 'Paid',
    address: {
      fullName: 'Deepak Kumar',
      phone: '9944332211',
      doorNo: '5A, Gandhi Nagar',
      street: 'Kottar',
      city: 'Nagercoil',
      pincode: '629002',
      state: 'Tamil Nadu'
    }
  }
];

const INITIAL_SETTINGS = {
  websiteName: 'Namma Oor Karuvattu Kadai',
  websiteNameTa: 'நம்ம ஊர் கருவாடு கடை',
  logo: '/assets/logo.png',
  contactPhone: '+91 94420 XXXXX',
  contactEmail: 'orders@nammaoor.com',
  whatsappNumber: '+9194420XXXXX',
  freeShippingThreshold: 500,
  flatDeliveryCharge: 50,
  instagramUrl: 'https://instagram.com',
  facebookUrl: 'https://facebook.com',
  youtubeUrl: 'https://youtube.com',
  maintenanceMode: false
};

const INITIAL_USERS = [
  { id: 'usr-1', name: 'Anbarasan M', email: 'customer@gmail.com', phone: '9876543210', joinedDate: '2026-01-10', ordersCount: 15, status: 'Active', addresses: [
    { id: 'addr-1', fullName: 'Anbarasan M', phone: '9876543210', doorNo: '14/3, East Coast Road', street: 'Thiruvanmiyur', city: 'Chennai', pincode: '600041', state: 'Tamil Nadu', isDefault: true }
  ]},
  { id: 'usr-2', name: 'Admin Selvam', email: 'admin@nammaoor.com', phone: '9000011111', joinedDate: '2025-10-01', ordersCount: 0, status: 'Active', role: 'admin', addresses: [] }
];

// Helper to initialize and retrieve DB
const getDB = () => {
  if (typeof window === 'undefined') return { products: INITIAL_PRODUCTS, categories: INITIAL_CATEGORIES, coupons: INITIAL_COUPONS, banners: INITIAL_BANNERS, orders: INITIAL_ORDERS, settings: INITIAL_SETTINGS, users: INITIAL_USERS };
  
  let db = localStorage.getItem('nok_db');
  if (!db) {
    const initialDB = {
      products: INITIAL_PRODUCTS,
      categories: INITIAL_CATEGORIES,
      coupons: INITIAL_COUPONS,
      banners: INITIAL_BANNERS,
      orders: INITIAL_ORDERS,
      settings: INITIAL_SETTINGS,
      users: INITIAL_USERS
    };
    localStorage.setItem('nok_db', JSON.stringify(initialDB));
    return initialDB;
  }
  return JSON.parse(db);
};

const saveDB = (db) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nok_db', JSON.stringify(db));
  }
};

export const mockAPI = {
  // Products API
  getProducts: () => {
    return getDB().products;
  },
  getProductBySlug: (slug) => {
    return getDB().products.find(p => p.slug === slug);
  },
  saveProduct: (product) => {
    const db = getDB();
    if (product.id) {
      db.products = db.products.map(p => p.id === product.id ? product : p);
    } else {
      product.id = 'prod-' + Date.now();
      db.products.push(product);
    }
    saveDB(db);
    return product;
  },
  deleteProduct: (id) => {
    const db = getDB();
    db.products = db.products.filter(p => p.id !== id);
    saveDB(db);
    return true;
  },
  toggleProductStatus: (id) => {
    const db = getDB();
    db.products = db.products.map(p => {
      if (p.id === id) {
        return { ...p, inStock: !p.inStock };
      }
      return p;
    });
    saveDB(db);
    return true;
  },

  // Categories API
  getCategories: () => {
    return getDB().categories;
  },

  // Coupons API
  getCoupons: () => {
    return getDB().coupons;
  },
  saveCoupon: (coupon) => {
    const db = getDB();
    const exists = db.coupons.find(c => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (exists) {
      db.coupons = db.coupons.map(c => c.code.toUpperCase() === coupon.code.toUpperCase() ? coupon : c);
    } else {
      db.coupons.push(coupon);
    }
    saveDB(db);
    return coupon;
  },
  deleteCoupon: (code) => {
    const db = getDB();
    db.coupons = db.coupons.filter(c => c.code.toUpperCase() !== code.toUpperCase());
    saveDB(db);
    return true;
  },

  // Banners API
  getBanners: () => {
    return getDB().banners;
  },
  saveBanner: (banner) => {
    const db = getDB();
    if (banner.id) {
      db.banners = db.banners.map(b => b.id === banner.id ? banner : b);
    } else {
      banner.id = Date.now();
      db.banners.push(banner);
    }
    saveDB(db);
    return banner;
  },
  deleteBanner: (id) => {
    const db = getDB();
    db.banners = db.banners.filter(b => b.id !== id);
    saveDB(db);
    return true;
  },

  // Orders API
  getOrders: () => {
    return getDB().orders;
  },
  getOrderById: (id) => {
    return getDB().orders.find(o => o.id === id);
  },
  createOrder: (orderData) => {
    const db = getDB();
    const newOrder = {
      ...orderData,
      id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString(),
      status: 'Processing',
      paymentStatus: orderData.paymentMethod === 'Cash on Delivery (COD)' ? 'Pending' : 'Paid'
    };
    db.orders.unshift(newOrder);

    // Deduct stock
    newOrder.items.forEach(item => {
      const prod = db.products.find(p => p.id === item.productId);
      if (prod) {
        prod.variants = prod.variants.map(v => {
          if (v.weight === item.weight) {
            const newStock = Math.max(0, v.stock - item.quantity);
            return { ...v, stock: newStock };
          }
          return v;
        });
        // check if any variant has stock
        const totalStock = prod.variants.reduce((acc, curr) => acc + curr.stock, 0);
        if (totalStock === 0) {
          prod.inStock = false;
        }
      }
    });

    saveDB(db);
    return newOrder;
  },
  updateOrderStatus: (id, status) => {
    const db = getDB();
    db.orders = db.orders.map(o => o.id === id ? { ...o, status } : o);
    saveDB(db);
    return true;
  },

  // Users API
  getUsers: () => {
    return getDB().users;
  },
  toggleUserStatus: (id) => {
    const db = getDB();
    db.users = db.users.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'Active' ? 'Blocked' : 'Active' };
      }
      return u;
    });
    saveDB(db);
    return true;
  },
  addAddress: (email, address) => {
    const db = getDB();
    db.users = db.users.map(u => {
      if (u.email === email) {
        const newAddr = { ...address, id: 'addr-' + Date.now(), isDefault: u.addresses.length === 0 };
        return { ...u, addresses: [...u.addresses, newAddr] };
      }
      return u;
    });
    saveDB(db);
    return true;
  },

  // Settings API
  getSettings: () => {
    return getDB().settings;
  },
  saveSettings: (settings) => {
    const db = getDB();
    db.settings = settings;
    saveDB(db);
    return settings;
  }
};
