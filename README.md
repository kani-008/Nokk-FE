# Nokk-FE

Frontend for Namma Oor Karuvattu Kadai — a dry fish, pickle and seafood store for Tamil Nadu. This repo is the storefront customers shop on and the admin panel I run the business from. Live at nammaoorkaruvattukadai.com.

Built with React 19 on Vite, Tailwind v4, TanStack Query for anything that comes from the API, and Zustand for the small bits of state that live purely on the client (auth session, cart, wishlist, buy-now flow).

## Stack

- React 19 + Vite
- Tailwind CSS v4 (using `@theme`, not the old config-file approach)
- TanStack Query v5 for server state
- Zustand v5 for client state
- React Router v7
- Axios
- react-helmet-async for per-page SEO tags
- Razorpay Checkout.js on the client side
- Google Identity Services loaded via script tag (didn't use the npm wrapper)
- Deployed on Vercel

## Running it locally

You need Node 18+.

```bash
git clone https://github.com/kani-008/Nokk-FE.git
cd Nokk-FE
git checkout develop
npm install
npm run dev
```

Dev server runs on localhost:5173 by default.

Other scripts:
```bash
npm run build     # production build, outputs to dist/
npm run preview   # serve the production build locally
npm run lint
```

## Environment variables

There's no `.env.example` in this repo — just make a `.env` in the root with these:

```
VITE_LHOST_API_URL=            # backend base URL, point this at your local Nokk-BE
VITE_GOOGLE_CLIENT_ID=         # Google Identity Services client ID
VITE_GEOAPIFY_API_KEY=         # Geoapify, for GPS location / address autocomplete
VITE_GOV_API_KEY=              # data.gov.in key, used for the PIN code dataset
VITE_GOV_PINCODE_RESOURCE_ID=  # data.gov.in resource ID for that dataset
```

Don't commit this file. We've had two `.env` leaks already on this project (one in June, one in July), so treat every key above as something that would need rotating if it ever showed up in a commit, a screenshot, a chat log, anywhere.

## Folder structure

Full tree, pulled straight from `develop`, node_modules stripped out:

```
Nokk-FE/
├── .claude/
│   └── launch.json
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
    ├── index.css                          # Tailwind v4 @theme tokens + clamp()-based fluid scale
    │
    ├── ApiCall/
    │   └── Api.jsx                        # single Axios instance, interceptors live here
    │
    ├── hookqueries/                        # one file per domain, all TanStack Query
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
    │   │   ├── Dropdown.jsx                # replaces native <select> everywhere in admin
    │   │   ├── EditProduct.jsx             # combo management lives inside this now, no separate modal
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
    │   └── store/                          # Zustand
    │       ├── AuthStore.jsx               # nok-auth
    │       ├── BuyNowStore.js
    │       ├── CartStore.jsx
    │       └── WishlistStore.jsx           # nok-wishlist — stores product IDs only, not full objects
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
            ├── AdminLayout.jsx              # topbar search is page-aware via <Outlet context>
            ├── Appearance.jsx               # CSS-variable color controls, no rebuild needed to retheme
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

## A few things worth knowing before you touch this codebase

**Server state and client state don't mix.** Anything coming from the API goes through a `hookqueries` file with TanStack Query. Zustand only holds things that are genuinely client-only — session, cart, wishlist IDs, the buy-now flow. If you're tempted to put API data in a Zustand store, don't.

**The backend uses action-named routes, not REST-style paths.** So you'll see things like `/get-by-id` and `/update-offer` instead of `/products/:id`. IDs go in the request body for writes and the query string for single-item GETs. Keep that in mind when wiring up a new hook.

**New admin features go into existing screens where possible.** When combo management was added, it went inside the `EditProduct` modal instead of getting its own page. Try to follow that pattern rather than spinning up new admin routes for every feature.

**Stock is binary.** In stock or out of stock, 1 or 0. There's no quantity, no "low stock" badge, nothing decrementing on order. If you see UI implying otherwise, it's wrong and should be flagged.

**Sizing is fluid, not breakpoint-based.** Spacing and type scale use `clamp()` starting from a 320px floor. Admin panel itself is really only tuned for 1440×900 desktop use since that's the only place it's used day to day.

**Dropdown and inline banners over native browser dialogs.** No `alert()`, no `confirm()`, no native `<select>` in the admin UI — use the shared components.

## Third-party bits

- **Razorpay** — Checkout.js on the client, loaded through `useRazorpayScript`.
- **Google Sign-In** — via the GIS script tag. If someone already has an email/password account and signs in with Google using the same email, there's a one-time password-confirm step to link the accounts rather than silently merging them.
- **Geoapify** — GPS location + address autocomplete. Scoped but not fully wired in yet — still deciding whether this lives in checkout, in the admin panel, or both.
- **India Post PIN codes** — resolved against the backend's own `pincode_directory` table now instead of hitting Nominatim.

## Deploying

Vercel, deployed off `develop`. Domain is on Spaceship, frontend DNS records point at Vercel, the `api.` subdomain points at Render where the backend lives.

If a feature touches both repos (new SEO routes, newsletter, anything the frontend calls that's new on the backend), deploy the backend first. Deploying frontend first means it's calling routes that don't exist yet.

## Not doing (on purpose)

No i18n, no newsletter sending (we capture subscribers, we don't email them — yet), no analytics, no PWA. These have come up and been turned down, not just left undone.

## Related repo

Backend lives at [kani-008/Nokk-BE](https://github.com/kani-008/Nokk-BE).
