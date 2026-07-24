// Structured Data Schema Builders for SEO

export function applyActiveOffer(price, offer) {
  if (!offer) return null;
  if (offer.type === "percentage" || offer.discountType === "percentage") {
    const value = offer.discountValue;
    const raw = (price * value) / 100;
    const discount = offer.maxDiscount != null ? Math.min(raw, offer.maxDiscount) : raw;
    return Math.max(price - discount, 0);
  }
  if (offer.type === "flat" || offer.discountType === "flat") {
    return Math.max(price - offer.discountValue, 0);
  }
  return null;
}

const SITE_URL = "https://nammaoorkaruvattukadai.com";
const IMAGE_BASE = "https://ik.imagekit.io/Nokk";

export function buildOrganizationSchema(settings = {}) {
  const sameAs = [
    settings.instagramUrl,
    settings.facebookUrl,
    settings.youtubeUrl,
    settings.twitterUrl,
  ].filter(Boolean);

  if (settings.whatsappNumber) {
    const cleanNumber = String(settings.whatsappNumber).replace(/[^0-9]/g, "");
    sameAs.push(`https://wa.me/${cleanNumber}`);
  }

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Namma Oor Karuvattu Kadai",
    "url": SITE_URL,
    "logo": `${SITE_URL}/logo2.png`,
    "sameAs": sameAs,
    "telephone": settings.storePhone || "+91 98765 43210",
    "email": settings.storeEmail || "hello@nammakadai.com",
    "foundingCountry": "IN",
    "areaServed": "Tamil Nadu",
    "priceRange": "₹₹",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": settings.storePhone || "+91 98765 43210",
      "contactType": "customer service"
    }
  };
}

export function buildLocalBusinessSchema(settings = {}) {
  const payments = [];
  if (settings.codEnabled ?? true) payments.push("COD");
  if (settings.upiEnabled ?? true) payments.push("UPI");
  if (settings.cardEnabled ?? true) payments.push("Credit Card", "Debit Card");
  if (settings.netbankingEnabled ?? true) payments.push("Net Banking");
  const paymentAcceptedString = payments.join(", ") || "Cash, UPI, Cards";

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Namma Oor Karuvattu Kadai",
    "url": SITE_URL,
    "logo": `${SITE_URL}/fav.png`,
    "image": `${SITE_URL}/logo2.png`,
    "telephone": settings.storePhone || "+91 9344796606",
    "priceRange": "₹₹",
    "currenciesAccepted": "INR",
    "paymentAccepted": paymentAcceptedString,
    "openingHours": "Mo-Su 09:00-21:00",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Singarathoppu",
      "addressLocality": "Cuddalore Old Town, Cuddalore",
      "addressRegion": "Tamil Nadu",
      "postalCode": "607003",
      "addressCountry": "IN"
    }
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Namma Oor Karuvattu Kadai",
    "url": SITE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${SITE_URL}/products?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function buildBreadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.item
    }))
  };
}

export function buildProductSchema(product, settings = {}) {
  if (!product) return null;

  const rawPrice = product.variants?.[0]?.price ?? product.minPrice ?? 0;
  const offerPrice = product.activeOffer ? applyActiveOffer(rawPrice, product.activeOffer) : null;
  const price = offerPrice != null ? offerPrice : rawPrice;
  const inStock = product.variants?.[0]?.inStock ?? product.inStock ?? false;

  // Helper to format images as absolute HTTPS URLs
  const toAbsoluteUrl = (img) => {
    if (!img) return null;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    const cleanPath = img.startsWith(".") ? img.slice(1) : img.startsWith("/") ? img : "/" + img;
    if (cleanPath.startsWith("/logo") || cleanPath.startsWith("/fav")) {
      return `${SITE_URL}${cleanPath}`;
    }
    return `${IMAGE_BASE}${cleanPath}`;
  };

  // Build array of image URLs
  const imageList = [];
  if (product.primaryImage) {
    const mainImg = toAbsoluteUrl(product.primaryImage);
    if (mainImg) imageList.push(mainImg);
  }
  if (Array.isArray(product.images)) {
    product.images.forEach((i) => {
      const url = toAbsoluteUrl(typeof i === "string" ? i : i?.imageUrl);
      if (url && !imageList.includes(url)) imageList.push(url);
    });
  }
  if (imageList.length === 0) {
    imageList.push(`${SITE_URL}/logo2.png`);
  }

  const productName = product.nameEn || product.name || "Product";
  const productUrl = `${SITE_URL}/products/${product.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": productName,
    "url": productUrl,
    "image": imageList,
    "description": product.description || `Buy authentic ${productName} online from Namma Oor Karuvattu Kadai.`,
    "sku": String(product.id),
    "brand": {
      "@type": "Brand",
      "name": "Namma Oor Karuvattu Kadai"
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "INR",
      "price": String(price),
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
    /*
    // PAUSED FOR PHASE 1 - Can be re-enabled in Phase 2
    ...(product.avgRating && product.reviewCount > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.avgRating,
        "reviewCount": product.reviewCount
      }
    })
    */
  };
}
