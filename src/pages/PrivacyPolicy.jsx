import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import API from "../ApiCall/Api.jsx";

export default function PrivacyPolicy() {
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
        <title>Privacy Policy — Namma Oor Karuvattu Kadai</title>
        <meta name="description" content="Privacy Policy for Namma Oor Karuvattu Kadai. Learn how we collect, use, and protect your personal information." />
      </Helmet>

      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-sandal-100 p-6 sm:p-10 shadow-sm">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Privacy Policy
        </h1>
        <p className="font-body text-xs text-gray-400 mb-8 uppercase tracking-wider">
          Last Updated: July 4, 2026
        </p>

        <div className="space-y-6 font-body text-sm text-gray-600 leading-relaxed">
          <p>
            This Privacy Policy governs how <strong>Namma Oor Karuvattu Kadai</strong> ("we", "us", or "our") collects, uses, maintains, and discloses information collected from users (each, a "User") of the website.
          </p>

          <section>
            <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 mb-2">
              1. Information We Collect
            </h2>
            <p>
              We may collect personal identification information from Users in a variety of ways, including, but not limited to, when Users visit our site, register on the site, place an order, subscribe to the newsletter, and in connection with other activities, services, features, or resources we make available on our site. Users may be asked for, as appropriate, name, email address, mailing address, phone number, and payment information.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 mb-2">
              2. How We Use It
            </h2>
            <p>
              Namma Oor Karuvattu Kadai may collect and use Users' personal information for the following purposes:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>To improve customer service and support.</li>
              <li>To personalize user experience and present products customized to your preferences.</li>
              <li>To process payments and fulfill orders.</li>
              <li>To send periodic emails, newsletters, or order updates.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 mb-2">
              3. Cookies
            </h2>
            <p>
              Our Site may use "cookies" to enhance User experience. User's web browser places cookies on their hard drive for record-keeping purposes and sometimes to track information about them. Users may choose to set their web browser to refuse cookies, or to alert you when cookies are being sent. If they do so, note that some parts of the Site may not function properly.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 mb-2">
              4. Third-Party Sharing
            </h2>
            <p>
              We do not sell, trade, or rent Users' personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners, trusted affiliates, and advertisers.
            </p>
            <p className="mt-2">
              For transaction processing, we use secure third-party payment gateways. Specifically, our payments are processed securely through <strong>Razorpay</strong>. We do not store credit card details or other sensitive payment credentials on our servers.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 mb-2">
              5. Data Security
            </h2>
            <p>
              We adopt appropriate data collection, storage, and processing practices and security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information, username, password, transaction information, and data stored on our Site.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base sm:text-lg font-bold text-gray-900 mb-2">
              6. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us at:
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
