import SEO from "../components/seo/SEO.jsx";
import { usePublicSettings } from "../hookqueries/useSettings";
import ReactMarkdown from "react-markdown";

export default function LegalPrivacy() {
  const { data: settings = {} } = usePublicSettings();
  const privacyContent = settings.privacyContent;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <SEO
        title="Privacy Policy — Namma Oor Karuvattu Kadai"
        description="Privacy Policy for Namma Oor Karuvattu Kadai. Learn how we collect, use, and safeguard your data."
        url="https://nammaoorkaruvattukadai.com/privacy-policy"
      />

      <div className="bg-surface rounded-2xl border border-amber-100 p-6 sm:p-10 shadow-sm">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 mb-2">
          Privacy Policy
        </h1>
        <p className="font-body text-xs text-amber-600 mb-8 uppercase tracking-wider">
          Last updated: July 4, 2026
        </p>

        {privacyContent ? (
            <div className="space-y-4 [&_h2]:font-display [&_h2]:text-lg [&_h2]:sm:text-xl [&_h2]:font-bold [&_h2]:text-brand-900 [&_h2]:mb-3 [&_h2]:mt-6 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-brand-950 [&_a]:text-brand-900 [&_a]:underline [&_a]:hover:text-amber-600 [&_a]:transition-colors">
              <ReactMarkdown>
                {privacyContent}
              </ReactMarkdown>
            </div>
        ) : (
          <div className="font-body text-sm text-amber-800 leading-relaxed space-y-6">
            <p>
              At <strong>Namma Oor Karuvattu Kadai</strong> ("we", "us", "our"), we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our website.
            </p>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                1. Information We Collect
              </h2>
              <p>
                We collect personal information necessary to provide our services and process your orders. This includes:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1.5 mt-2">
                <li><strong>Personal Details:</strong> Your name, phone number, and email address.</li>
                <li><strong>Shipping Address:</strong> Address details to coordinate delivery of your orders.</li>
                <li><strong>Payment Details:</strong> Transaction details necessary to confirm order payments.</li>
              </ul>
              <p className="mt-2">
                This information is collected solely for order processing, logistics/delivery, and customer support.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                2. How We Use Your Information
              </h2>
              <p>
                We use the collected information for the following business purposes:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1.5 mt-2">
                <li>Fulfilling and processing your orders.</li>
                <li>Coordinating with delivery partners for shipment logistics.</li>
                <li>Providing active customer service and answering queries.</li>
                <li>Sending order updates and OTP (One-Time Password) verification codes via WhatsApp.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                3. WhatsApp OTP Verification
              </h2>
              <p>
                To verify your phone number during login and registration, we send one-time passwords (OTP) via WhatsApp using Meta's WhatsApp Business Platform. Your phone number is shared with Meta Platforms, Inc. solely for the purpose of OTP delivery, in accordance with Meta's own privacy policy.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                4. Payment Information
              </h2>
              <p>
                Payments are processed securely through <strong>Razorpay</strong>. We do not store your card, UPI, or banking credentials on our servers — these are handled directly by Razorpay's PCI-DSS compliant systems.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                5. Cookies
              </h2>
              <p>
                Our website uses cookies to enhance your browsing experience. Cookies are small text files stored on your device that help us persist items in your shopping cart, remember your preference settings, and track session information. You may disable cookies in your browser settings, though doing so might affect the functionality of certain features on the site.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                6. Data Sharing
              </h2>
              <p>
                We do not sell your personal information. We share data only with:
              </p>
              <ol className="list-decimal list-inside ml-4 space-y-1.5 mt-2">
                <li><strong>Razorpay</strong> for processing transaction payments.</li>
                <li><strong>Meta / WhatsApp</strong> for secure OTP delivery.</li>
                <li>Our logistics and delivery partners for order fulfillment and shipping.</li>
                <li>Regulatory or governmental authorities when required by applicable laws.</li>
              </ol>
            </section>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                7. Your Rights
              </h2>
              <p>
                Under India's Digital Personal Data Protection Act, 2023 (DPDP Act), you have the right to request access to, correction of, or deletion of your personal data. To exercise any of these rights, please reach out to us at <a href="mailto:nammaoorkaruvattukadai@gmail.com" className="text-brand-900 font-semibold underline hover:text-amber-600 transition-colors">nammaoorkaruvattukadai@gmail.com</a>.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                8. Data Security
              </h2>
              <p>
                We adopt reasonable technical and organizational security measures to prevent unauthorized access, alteration, disclosure, or destruction of your personal data. We transfer sensitive data via encrypted channels. However, please note that no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute data security.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                9. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy periodically to reflect changes in our operational or regulatory practices. Continued use of our website after changes are posted constitutes your acceptance of the updated policy.
              </p>
            </section>

            <section className="pt-6 border-t border-amber-100">
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-900 mb-3">
                Contact Us
              </h2>
              <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-100 text-xs sm:text-sm text-amber-900 font-body space-y-1">
                <p className="font-bold text-brand-900 text-sm">Namma Oor Karuvattu Kadai</p>
                <p> Cuddalore Old Town,</p>
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
