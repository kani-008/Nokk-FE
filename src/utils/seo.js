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
    "url": "https://nammaoorkaruvattukadai.com",
    "logo": "https://nammaoorkaruvattukadai.com/logo.png",
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
    "url": "https://nammaoorkaruvattukadai.com",
    "logo": "https://ik.imagekit.io/Nokk/logo/fav.png",
    "image": "https://ik.imagekit.io/Nokk/logo/logo2.png",
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
    "url": "https://nammaoorkaruvattukadai.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://nammaoorkaruvattukadai.com/products?search={search_term_string}"
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
  const SITE_URL = "https://nammaoorkaruvattukadai.com";
  
  const rawPrice = product.variants?.[0]?.price ?? product.minPrice ?? 0;
  const offerPrice = product.activeOffer ? applyActiveOffer(rawPrice, product.activeOffer) : null;
  const price = offerPrice != null ? offerPrice : rawPrice;
  const inStock = product.variants?.[0]?.inStock ?? product.inStock ?? false;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.nameEn,
    "image": product.primaryImage || `${SITE_URL}/logo.png`,
    "description": product.description || `Buy authentic ${product.nameEn} online from Namma Oor Karuvattu Kadai.`,
    "sku": String(product.id),
    "brand": {
      "@type": "Brand",
      "name": "Namma Oor Karuvattu Kadai"
    },
    "offers": {
      "@type": "Offer",
      "url": `${SITE_URL}/products/${product.slug}`,
      "priceCurrency": "INR",
      "price": price,
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
