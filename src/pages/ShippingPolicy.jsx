import SEO from "../components/seo/SEO.jsx";
import { usePublicSettings } from "../hookqueries/useSettings";
import ReactMarkdown from "react-markdown";

export default function ShippingPolicy() {
  const { data: settings = {} } = usePublicSettings();
  const shippingContent = settings.shippingContent;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <SEO
        title="Shipping Policy — Namma Oor Karuvattu Kadai"
        description="Shipping Policy for Namma Oor Karuvattu Kadai. Learn about our delivery timeframes, shipping charges, and what happens if a delivery is delayed or fails."
        url="https://nammaoorkaruvattukadai.com/shipping-policy"
      />

      <div className="bg-surface rounded-2xl border border-amber-100 p-6 sm:p-10 shadow-sm">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 mb-2">
          Shipping Policy
        </h1>
        <p className="font-body text-xs text-amber-600 mb-8 uppercase tracking-wider">
          Last updated: July 15, 2026
        </p>

        {shippingContent ? (
            <div className="space-y-4 [&_h2]:font-display [&_h2]:text-lg [&_h2]:sm:text-xl [&_h2]:font-bold [&_h2]:text-brand-900 [&_h2]:mb-3 [&_h2]:mt-6 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-brand-950 [&_a]:text-brand-900 [&_a]:underline [&_a]:hover:text-amber-600 [&_a]:transition-colors">
              <ReactMarkdown>
                {shippingContent}
              </ReactMarkdown>
            </div>
        ) : (
          <div className="font-body text-sm text-amber-800 leading-relaxed space-y-6">
            <p>
              At <strong>Namma Oor Karuvattu Kadai</strong>, we take great care to ensure your order reaches you fresh, safe, and on time. This Shipping Policy explains our delivery process, timeframes, and what happens if something goes wrong along the way.
            </p>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                1. Delivery Areas
              </h2>
              <p>
                We currently ship across India through our trusted courier and logistics partners. Deliveries to coastal Tamil Nadu and nearby regions are typically the fastest, given our proximity to the source.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                2. Order Processing Time
              </h2>
              <p>
                Orders are packed and dispatched within <strong>24-48 hours</strong> of payment confirmation. Orders placed on Sundays or public holidays are processed on the next working day.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                3. Estimated Delivery Timeframe
              </h2>
              <p>
                Once dispatched, orders typically arrive within <strong>3-7 business days</strong>, depending on your location. Metro cities and nearby regions may receive orders faster, while remote or rural areas may take slightly longer.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                4. Shipping Charges
              </h2>
              <p>
                A flat shipping fee applies to orders below our free-shipping threshold. Orders above this threshold qualify for <strong>free shipping</strong>. Exact charges and thresholds are displayed at checkout.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                5. Order Tracking
              </h2>
              <p>
                Once your order is shipped, you will receive tracking details via WhatsApp, SMS, or email so you can follow your package's journey until it arrives.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                6. Failed or Delayed Deliveries
              </h2>
              <p>
                If a delivery attempt is unsuccessful, our courier partner will typically attempt redelivery or hold the package at a nearby facility for pickup. If you do not respond within a reasonable window, the order may be returned to us, and any applicable refund will be processed after deducting shipping costs. Delays due to weather, regional logistics disruptions, or unforeseen circumstances are occasionally unavoidable — we appreciate your patience and will keep you informed of any significant delay.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                7. Packaging
              </h2>
              <p>
                All orders are sealed in premium, multi-layer, odour-proof packaging designed to preserve freshness and prevent damage during transit.
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
        )}
      </div>
    </div>
  );
}
