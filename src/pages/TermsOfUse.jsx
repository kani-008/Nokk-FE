import { Helmet } from "react-helmet-async";

export default function TermsOfUse() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <Helmet>
        <title>Terms of Use — Namma Oor Karuvattu Kadai</title>
        <meta name="description" content="Terms of Use for Namma Oor Karuvattu Kadai. Read our terms and conditions for orders, payments, and shipping." />
      </Helmet>

      <div className="bg-surface rounded-2xl border border-amber-100 p-6 sm:p-10 shadow-sm">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 mb-2">
          Terms & Conditions
        </h1>
        <p className="font-body text-xs text-amber-600 mb-8 uppercase tracking-wider">
          Last updated: July 4, 2026
        </p>

        <div className="font-body text-sm text-amber-800 leading-relaxed space-y-6">
          <p>
            Welcome to <strong>Namma Oor Karuvattu Kadai</strong>. By accessing or using our website, you agree to be bound by the following terms and conditions. If you do not agree to these terms, please do not use this website.
          </p>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
              1. Eligibility
            </h2>
            <p>
              To place orders or register an account on our website, you must be 18 years of age or older, or accessing the website under the active supervision of a parent or legal guardian.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
              2. Products & Availability
            </h2>
            <p>
              All products listed on the site are subject to availability. We reserve the right to modify prices or discontinue items without prior notice. Product images displayed on the website are for illustrative purposes — actual items may vary slightly in appearance due to the natural variations and characteristics of seafood and traditional processing.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
              3. Orders & Payment
            </h2>
            <p>
              Orders are processed only after successful payment confirmation. We accept payment methods processed securely through Razorpay (including major credit/debit cards and UPI), manual UPI transfer, and Cash on Delivery (COD) where available. Customers are responsible for providing complete, accurate billing and shipping information at checkout.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
              4. Shipping & Delivery
            </h2>
            <p>
              The estimated delivery timeframe is <strong>3-5 business days</strong> from order confirmation. Delivery times are estimates and may vary based on location, weather conditions, or logistics constraints. Please refer to our Shipping Policy for full details.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
              5. Returns & Refunds
            </h2>
            <p>
              Due to the perishable nature of our dry fish and pickles, we do not accept returns or exchanges after delivery has been completed. Exceptions are made solely for damaged, incorrect, or missing items reported within 24 hours of delivery with clear photo evidence. Please refer to our Return & Refund Policy for detailed information.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
              6. Account & OTP Login
            </h2>
            <p>
              Users are responsible for maintaining the confidentiality of their account access via phone-based OTP (One-Time Password) login. You agree not to share your OTP codes with anyone, including individuals claiming to represent Namma Oor Karuvattu Kadai. We will never ask you for your login OTP.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
              7. Intellectual Property
            </h2>
            <p>
              All content, text, images, logos, copy, graphics, and designs on this website are the exclusive property of Namma Oor Karuvattu Kadai and are protected by applicable intellectual property laws. They may not be copied, reproduced, distributed, or used without our prior written permission.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
              8. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, Namma Oor Karuvattu Kadai and its affiliates shall not be liable for any indirect, incidental, special, or consequential damages arising out of the use or inability to use this website, services, or purchased products.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
              9. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms of Use shall be governed by and construed in accordance with the laws of <strong>India</strong>. Any legal action or dispute arising under these terms shall be subject to the exclusive jurisdiction of the competent courts in Cuddalore, Tamil Nadu.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
              10. Changes to Terms
            </h2>
            <p>
              We reserve the right to revise or update these Terms & Conditions at any time. Continued use of our website following any updates constitutes your agreement to be bound by the modified terms.
            </p>
          </section>

          <section className="pt-6 border-t border-amber-100">
            <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
              Contact Us
            </h2>
            <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-100 text-xs sm:text-sm text-amber-900 font-body space-y-1">
              <p className="font-bold text-brand-900 text-sm">Namma Oor Karuvattu Kadai</p>
              <p>No: 13, North Street, Singarathoppu, Cuddalore Old Town,</p>
              <p>Cuddalore - 607003, Tamil Nadu, India</p>
              <p className="pt-2"><strong>Email:</strong> <a href="mailto:nammaoorkaruvattukadai@gmail.com" className="text-brand-900 underline hover:text-amber-600 transition-colors">nammaoorkaruvattukadai@gmail.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
