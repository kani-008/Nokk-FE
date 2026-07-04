import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import API from "../ApiCall/Api.jsx";

export default function TermsOfUse() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    API.get("/settings/get-all")
      .then((res) => setSettings(res.data.settings || {}))
      .catch(() => {});
  }, []);

  const address = settings.storeAddress || "Ramanathapuram, Tamil Nadu — 623 526";

  return (
    <div className="page-wrap py-8 sm:py-12">
      <Helmet>
        <title>Terms of Use — Namma Oor Karuvattu Kadai</title>
        <meta name="description" content="Terms of Use for Namma Oor Karuvattu Kadai. Read our terms and conditions for orders, payments, and shipping." />
      </Helmet>

      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-sandal-100 p-6 sm:p-10 shadow-sm">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Terms of Use
        </h1>
        <p className="font-body text-xs text-gray-400 mb-8 uppercase tracking-wider">
          Last Updated: July 4, 2026
        </p>

        <div className="space-y-6 font-body text-sm text-gray-600 leading-relaxed">
          <p>
            Welcome to <strong>Namma Oor Karuvattu Kadai</strong>. These Terms of Use govern your access to and use of our website and services. By accessing or using our services, you agree to be bound by these terms.
          </p>

          <section>
            <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 mb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By purchasing our products or browsing our website, you agree to comply with and be bound by these Terms of Use, along with our Privacy Policy. If you do not agree to these terms, please do not use our website.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 mb-2">
              2. Orders & Payments
            </h2>
            <p>
              All orders placed through our platform are subject to product availability and acceptance. We reserve the right to refuse or cancel any order. Payments are processed securely via third-party providers (including Razorpay). Prices for our products are subject to change without notice.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 mb-2">
              3. Shipping & Delivery
            </h2>
            <p>
              We ship products to various locations across India. Shipping timelines and fees are calculated at checkout. While we strive to deliver your items within the estimated timeframe, delays may occur due to logistics or external factors beyond our control.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 mb-2">
              4. Returns
            </h2>
            <p>
              For details on cancellations, replacements, or refunds, please reference our Return Policy. Due to the perishable nature of dry fish and pickles, returns are handled case-by-case based on product quality or damage during transit.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 mb-2">
              5. Limitation of Liability
            </h2>
            <p>
              Namma Oor Karuvattu Kadai and its affiliates shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our products or website.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 mb-2">
              6. Governing Law
            </h2>
            <p>
              These Terms of Use and any separate agreements shall be governed by and construed in accordance with the laws of <strong>India</strong>, and any disputes shall be subject to the exclusive jurisdiction of the courts of Ramanathapuram, Tamil Nadu.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 mb-2">
              7. Contact Us
            </h2>
            <p>
              For any queries, feedback, or complaints regarding these Terms of Use, please contact us at:
            </p>
            <div className="mt-4 p-5 bg-sandal-50/50 rounded-xl border border-sandal-100 text-xs sm:text-sm text-gray-700">
              <p className="font-bold text-gray-900">Namma Oor Karuvattu Kadai</p>
              <p className="mt-1 font-body">{address}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
