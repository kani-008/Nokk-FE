# Nokk-FE

Nokk-FE is the frontend for Namma Oor Karuvattu Kadai, a Tamil Nadu based dry fish, pickle and seafood store.
It covers both the customer facing storefront and the internal admin panel in one codebase.
Built with React 19, Vite and Tailwind v4, and talks to the Nokk-BE API for everything server side.


🔗 [https://nammaoorkaruvattukadai.com](https://nammaoorkaruvattukadai.com)

## Tech Stack

- React 19
- Vite
- Tailwind CSS v4 (`@theme` tokens)
- TanStack Query v5
- Zustand v5
- React Router v7
- Axios
- react-helmet-async
- Razorpay Checkout.js
- Google Identity Services
- lucide-react / react-icons
- qrcode.react

## Folder Structure

```
Nokk-FE/
├── .env.example
├── .gitignore
├── README.md
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── tailwind.config.js
├── vercel.json
├── vite.config.js
├── public/
│   ├── _redirects
│   └── robots.txt
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    │
    ├── ApiCall/
    │   └── Api.jsx
    │
    ├── hookqueries/
    │   ├── useActiveCustomerVideos.js
    │   ├── useAdminDashboard.js
    │   ├── useBanners.js
    │   ├── useCombos.js
    │   ├── useCoupons.js
    │   ├── useGoogleAuth.js
    │   ├── useHome.js
    │   ├── useInventory.js
    │   ├── useNewsletter.js
    │   ├── useNotifications.js
    │   ├── useOffers.js
    │   ├── useOrders.js
    │   ├── useProducts.js
    │   ├── useProfile.js
    │   ├── useRazorpayScript.js
    │   ├── useReports.js
    │   ├── useSettings.js
    │   ├── useUsers.js
    │   └── useViewportPageSize.js
    │
    ├── components/
    │   ├── Theme.js
    │   ├── useToast.jsx
    │   ├── Product/
    │   │   ├── ImageGallery.jsx
    │   │   ├── ProductCard.jsx
    │   │   ├── ProductDescription.jsx
    │   │   └── ProductReviews.jsx
    │   ├── admin/
    │   │   ├── AdminUI.jsx
    │   │   ├── ColorPicker.jsx
    │   │   ├── ComboItemPicker.jsx
    │   │   ├── ComboModal.jsx
    │   │   ├── Dropdown.jsx
    │   │   ├── EditProduct.jsx
    │   │   ├── IconButton.jsx
    │   │   ├── TabToggle.jsx
    │   │   ├── TableFormat.jsx
    │   │   └── Toggle.jsx
    │   ├── checkout/
    │   │   ├── Address.jsx
    │   │   ├── AddressPickerSheet.jsx
    │   │   ├── CouponBox.jsx
    │   │   ├── OrderSummary.jsx
    │   │   ├── Payment.jsx
    │   │   ├── Review.jsx
    │   │   ├── StepBar.jsx
    │   │   └── statesList.js
    │   ├── home/
    │   │   ├── HeroBanner.jsx
    │   │   └── HomeSections.jsx
    │   ├── layout/
    │   │   ├── AnnouncementBar.jsx
    │   │   ├── AuthLayout.jsx
    │   │   ├── CustomerLayout.jsx
    │   │   ├── Footer.jsx
    │   │   ├── Logo.jsx
    │   │   ├── MobileDrawer.jsx
    │   │   └── NavBar.jsx
    │   ├── orders/
    │   │   ├── InvoiceDownload.js
    │   │   ├── OrderDetail.jsx
    │   │   ├── ReviewPage.jsx
    │   │   └── TrackingTimeline.jsx
    │   ├── route/
    │   │   └── ProtectedRoute.jsx
    │   └── store/
    │       ├── AuthStore.jsx
    │       ├── BuyNowStore.js
    │       ├── CartStore.jsx
    │       └── WishlistStore.jsx
    │
    └── pages/
        ├── Cart.jsx
        ├── Checkout.jsx
        ├── ComboDetails.jsx
        ├── Home.jsx
        ├── Login.jsx
        ├── MyOrders.jsx
        ├── Offers.jsx
        ├── PrivacyPolicy.jsx
        ├── ProductDetails.jsx
        ├── ProductReviewsPage.jsx
        ├── Products.jsx
        ├── Register.jsx
        ├── ReviewsOverview.jsx
        ├── TermsOfUse.jsx
        ├── Wishlist.jsx
        ├── profile.jsx
        └── admin/
            ├── AdminLayout.jsx
            ├── Appearance.jsx
            ├── BannerManagement.jsx
            ├── CategoryManagement.jsx
            ├── CouponManagement.jsx
            ├── CustomerVideoManagement.jsx
            ├── Dashboard.jsx
            ├── InventoryManagement.jsx
            ├── Notification.jsx
            ├── OfferManagement.jsx
            ├── OrderManagement.jsx
            ├── ProductManagement.jsx
            ├── ReportManagement.jsx
            ├── ReviewManagement.jsx
            ├── Settings.jsx
            └── UserManagement.jsx
```

## Environment Variables

```
# Backend API base URL
VITE_LHOST_API_URL=

# Location/Pincode APIs
VITE_GEOAPIFY_API_KEY=
VITE_GOV_API_KEY=
VITE_GOV_PINCODE_RESOURCE_ID=

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=
```

## APIs Used

- **Nokk-BE** — internal backend API, powers products, cart, orders, auth, and everything else
- **Google Identity Services** — Google Sign-In
- **Geoapify** — GPS-based location detection and address autocomplete
- **data.gov.in (India Post PIN code dataset)** — pincode lookup during address entry
- **Razorpay Checkout.js** — payment gateway on the client side

## About the Project

**Customer storefront** — The public side is where customers actually shop. They browse the product catalog, look through combos and running offers, add items to a cart or wishlist, and move through a multi-step checkout with coupon support and Razorpay payments. Once an order is placed, they can track its status, download an invoice, and leave a review once it's delivered. The whole experience is built mobile-first, since most customers land here from a phone.

**Admin panel** — The admin side is where the business is actually run day to day. Products, categories, combos, offers, and coupons are all managed here, along with inventory status, homepage banners, customer reviews, and video testimonials. There's a dashboard for keeping an eye on orders and performance, a reporting section, and an appearance editor that lets the site's color scheme be changed live through CSS variables without a rebuild. It's built for a desktop screen, since that's where it's actually used.

## Deploying

Hosted on Vercel. The domain is purchased and managed through Spaceship, with DNS pointed at Vercel.

## Related Repository

Backend API: [kani-008/Nokk-BE](https://github.com/kani-008/Nokk-BE)
