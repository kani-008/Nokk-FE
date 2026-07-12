import { useState, useEffect } from "react";
import { Save, Loader2, Check, FileText, Sparkles, HelpCircle } from "lucide-react";
import { AdminPage, AdminCard, AdminButton } from "../../components/admin/AdminUI.jsx";
import TabToggle from "../../components/admin/TabToggle.jsx";
import API from "../../ApiCall/Api.jsx";
import ReactMarkdown from "react-markdown";

const settingsApi = {
  get: async () => {
    const res = await API.get("/settings/get-all");
    return { settings: res.data.settings || {} };
  },
  update: async (data) => {
    const res = await API.put("/settings/update", data);
    return { settings: res.data.settings || {} };
  },
};

const DEFAULT_TERMS = `Welcome to **Namma Oor Karuvattu Kadai**. By accessing or using our website, you agree to be bound by the following terms and conditions. If you do not agree to these terms, please do not use this website.

## 1. Eligibility
To place orders or register an account on our website, you must be 18 years of age or older, or accessing the website under the active supervision of a parent or legal guardian.

## 2. Products & Availability
All products listed on the site are subject to availability. We reserve the right to modify prices or discontinue items without prior notice. Product images displayed on the website are for illustrative purposes — actual items may vary slightly in appearance due to the natural variations and characteristics of seafood and traditional processing.

## 3. Orders & Payment
Orders are processed only after successful payment confirmation. We accept payment methods processed securely through Razorpay (including major credit/debit cards and UPI), manual UPI transfer, and Cash on Delivery (COD) where available. Customers are responsible for providing complete, accurate billing and shipping information at checkout.

## 4. Shipping & Delivery
The estimated delivery timeframe is **3-5 business days** from order confirmation. Delivery times are estimates and may vary based on location, weather conditions, or logistics constraints. Please refer to our Shipping Policy for full details.

## 5. Returns & Refunds
Due to the perishable nature of our dry fish and pickles, we do not accept returns or exchanges after delivery has been completed. Exceptions are made solely for damaged, incorrect, or missing items reported within 24 hours of delivery with clear photo evidence. Please refer to our Return & Refund Policy for detailed information.

## 6. Account & OTP Login
Users are responsible for maintaining the confidentiality of their account access via phone-based OTP (One-Time Password) login. You agree not to share your OTP codes with anyone, including individuals claiming to represent Namma Oor Karuvattu Kadai. We will never ask you for your login OTP.

## 7. Intellectual Property
All content, text, images, logos, copy, graphics, and designs on this website are the exclusive property of Namma Oor Karuvattu Kadai and are protected by applicable intellectual property laws. They may not be copied, reproduced, distributed, or used without our prior written permission.

## 8. Limitation of Liability
To the maximum extent permitted by applicable law, Namma Oor Karuvattu Kadai and its affiliates shall not be liable for any indirect, incidental, special, or consequential damages arising out of the use or inability to use this website, services, or purchased products.

## 9. Governing Law & Jurisdiction
These Terms of Use shall be governed by and construed in accordance with the laws of **India**. Any legal action or dispute arising under these terms shall be subject to the exclusive jurisdiction of the competent courts in Cuddalore, Tamil Nadu.

## 10. Changes to Terms
We reserve the right to revise or update these Terms & Conditions at any time. Continued use of our website following any updates constitutes your agreement to be bound by the modified terms.`;

const DEFAULT_PRIVACY = `At **Namma Oor Karuvattu Kadai** ("we", "us", "our"), we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our website.

## 1. Information We Collect
We collect personal information necessary to provide our services and process your orders. This includes:
* **Personal Details:** Your name, phone number, and email address.
* **Shipping Address:** Address details to coordinate delivery of your orders.
* **Payment Details:** Transaction details necessary to confirm order payments.

This information is collected solely for order processing, logistics/delivery, and customer support.

## 2. How We Use Your Information
We use the collected information for the following business purposes:
* Fulfilling and processing your orders.
* Coordinating with delivery partners for shipment logistics.
* Providing active customer service and answering queries.
* Sending order updates and OTP (One-Time Password) verification codes via WhatsApp.

## 3. WhatsApp OTP Verification
To verify your phone number during login and registration, we send one-time passwords (OTP) via WhatsApp using Meta's WhatsApp Business Platform. Your phone number is shared with Meta Platforms, Inc. solely for the purpose of OTP delivery, in accordance with Meta's own privacy policy.

## 4. Payment Information
Payments are processed securely through **Razorpay**. We do not store your card, UPI, or banking credentials on our servers — these are handled directly by Razorpay's PCI-DSS compliant systems.

## 5. Cookies
Our website uses cookies to enhance your browsing experience. Cookies are small text files stored on your device that help us persist items in your shopping cart, remember your preference settings, and track session information. You may disable cookies in your browser settings, though doing so might affect the functionality of certain features on the site.

## 6. Data Sharing
We do not sell your personal information. We share data only with:
1. **Razorpay** for processing transaction payments.
2. **Meta / WhatsApp** for secure OTP delivery.
3. Our logistics and delivery partners for order fulfillment and shipping.
4. Regulatory or governmental authorities when required by applicable laws.

## 7. Your Rights
Under India's Digital Personal Data Protection Act, 2023 (DPDP Act), you have the right to request access to, correction of, or deletion of your personal data. To exercise any of these rights, please reach out to us at nammaoorkaruvattukadai@gmail.com.

## 8. Data Security
We adopt reasonable technical and organizational security measures to prevent unauthorized access, alteration, disclosure, or destruction of your personal data. We transfer sensitive data via encrypted channels. However, please note that no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute data security.

## 9. Changes to This Policy
We may update this Privacy Policy periodically to reflect changes in our operational or regulatory practices. Continued use of our website after changes are posted constitutes your acceptance of the updated policy.`;

const DEFAULT_WHY_US = [
  {
    emoji: "🎣",
    title: "Direct from Fishermen",
    desc: "We partner directly with coastal fishing families — no middleman, ensuring maximum freshness.",
  },
  {
    emoji: "☀️",
    title: "Sun-Dried Naturally",
    desc: "Traditional coastal sun-drying process under optimal hygienic standards. Zero chemicals.",
  },
  {
    emoji: "📦",
    title: "Hygienic Packaging",
    desc: "Premium multi-layer, odour-proof packaging that seals in coastal freshness for months.",
  },
];

export default function SiteContent() {
  const [activeTab, setActiveTab] = useState("terms");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [termsContent, setTermsContent] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");
  const [whyUsReasons, setWhyUsReasons] = useState(DEFAULT_WHY_US);

  useEffect(() => {
    settingsApi.get()
      .then((res) => {
        const s = res.settings || {};
        setTermsContent(s.termsContent || DEFAULT_TERMS);
        setPrivacyContent(s.privacyContent || DEFAULT_PRIVACY);
        if (s.whyUsReasons) {
          try {
            const parsed = typeof s.whyUsReasons === "string" ? JSON.parse(s.whyUsReasons) : s.whyUsReasons;
            if (Array.isArray(parsed) && parsed.length === 3) {
              setWhyUsReasons(parsed);
            } else {
              setWhyUsReasons(DEFAULT_WHY_US);
            }
          } catch (e) {
            setWhyUsReasons(DEFAULT_WHY_US);
          }
        } else {
          setWhyUsReasons(DEFAULT_WHY_US);
        }
      })
      .catch((err) => {
        setError("Failed to load current settings.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSaveTab = async (tab) => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      let payload = {};
      if (tab === "terms") {
        payload = { termsContent };
      } else if (tab === "privacy") {
        payload = { privacyContent };
      } else if (tab === "whyus") {
        payload = { whyUsReasons: JSON.stringify(whyUsReasons) };
      }
      await settingsApi.update(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const updateWhyUsField = (index, field, value) => {
    setWhyUsReasons((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const tabs = [
    { key: "terms", label: "Terms & Conditions", icon: FileText },
    { key: "privacy", label: "Privacy Policy", icon: FileText },
    { key: "whyus", label: "Why Choose Us", icon: Sparkles },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-brand-700" size={32} />
      </div>
    );
  }

  return (
    <AdminPage
      title="Site Content"
      sub="Manage legal pages and dynamic text sections of the website."
      action={
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg animate-fade-in">
              <Check size={14} /> Saved Successfully
            </span>
          )}
          {error && (
            <span className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
              {error}
            </span>
          )}
          <AdminButton
            variant="primary"
            onClick={() => handleSaveTab(activeTab)}
            disabled={saving}
            className="cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save size={15} /> Save Changes
              </>
            )}
          </AdminButton>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-150 pb-3">
          <TabToggle tabs={tabs} active={activeTab} onChange={setActiveTab} />
        </div>

        {/* ── Tab Content: Terms & Conditions ── */}
        {activeTab === "terms" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <AdminCard className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="field-label block font-semibold text-gray-700">Markdown Editor</span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <HelpCircle size={12} /> Supports Markdown
                </span>
              </div>
              <p className="text-xs text-gray-500 -mt-1 leading-relaxed">
                Use <code>## Heading</code> for sections, <code>**bold**</code> for emphasis, and blank lines to separate paragraphs.
              </p>
              <textarea
                value={termsContent}
                onChange={(e) => setTermsContent(e.target.value)}
                className="field-input min-h-[450px] font-mono text-sm leading-relaxed p-4 bg-gray-50 border-gray-200 focus:bg-surface focus:border-brand-500 rounded-xl"
                placeholder="Enter Terms & Conditions content in Markdown..."
              />
            </AdminCard>

            <AdminCard className="flex flex-col gap-3">
              <span className="field-label block font-semibold text-gray-700 border-b border-gray-100 pb-2">Live Preview</span>
              <div className="min-h-[492px] p-6 rounded-xl border border-amber-100 bg-amber-50/20 max-h-[550px] overflow-y-auto">
                <h1 className="font-display text-2xl font-bold text-brand-900 mb-2">Terms & Conditions</h1>
                <p className="font-body text-xs text-amber-600 mb-6 uppercase tracking-wider">Last updated: (Dynamic)</p>
                <ReactMarkdown className="font-body text-sm text-amber-800 leading-relaxed space-y-4 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-brand-900 [&_h2]:mt-5 [&_h2]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-brand-950">
                  {termsContent}
                </ReactMarkdown>
              </div>
            </AdminCard>
          </div>
        )}

        {/* ── Tab Content: Privacy Policy ── */}
        {activeTab === "privacy" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <AdminCard className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="field-label block font-semibold text-gray-700">Markdown Editor</span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <HelpCircle size={12} /> Supports Markdown
                </span>
              </div>
              <p className="text-xs text-gray-500 -mt-1 leading-relaxed">
                Use <code>## Heading</code> for sections, <code>**bold**</code> for emphasis, and blank lines to separate paragraphs.
              </p>
              <textarea
                value={privacyContent}
                onChange={(e) => setPrivacyContent(e.target.value)}
                className="field-input min-h-[450px] font-mono text-sm leading-relaxed p-4 bg-gray-50 border-gray-200 focus:bg-surface focus:border-brand-500 rounded-xl"
                placeholder="Enter Privacy Policy content in Markdown..."
              />
            </AdminCard>

            <AdminCard className="flex flex-col gap-3">
              <span className="field-label block font-semibold text-gray-700 border-b border-gray-100 pb-2">Live Preview</span>
              <div className="min-h-[492px] p-6 rounded-xl border border-amber-100 bg-amber-50/20 max-h-[550px] overflow-y-auto">
                <h1 className="font-display text-2xl font-bold text-brand-900 mb-2">Privacy Policy</h1>
                <p className="font-body text-xs text-amber-600 mb-6 uppercase tracking-wider">Last updated: (Dynamic)</p>
                <ReactMarkdown className="font-body text-sm text-amber-800 leading-relaxed space-y-4 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-brand-900 [&_h2]:mt-5 [&_h2]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-brand-950">
                  {privacyContent}
                </ReactMarkdown>
              </div>
            </AdminCard>
          </div>
        )}

        {/* ── Tab Content: Why Choose Us ── */}
        {activeTab === "whyus" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {whyUsReasons.map((reason, index) => (
              <AdminCard key={index} className="flex flex-col gap-4">
                <span className="field-label block font-bold text-brand-900 border-b border-gray-100 pb-2">
                  Reason Card #{index + 1}
                </span>

                <div className="space-y-1">
                  <label className="field-label text-xs font-semibold">Emoji Indicator</label>
                  <input
                    type="text"
                    value={reason.emoji}
                    onChange={(e) => updateWhyUsField(index, "emoji", e.target.value)}
                    placeholder="e.g. 🎣"
                    className="field-input font-mono text-center text-lg w-16 p-2 rounded-xl bg-gray-50 focus:bg-surface focus:border-brand-500 border border-gray-200"
                    maxLength={4}
                  />
                </div>

                <div className="space-y-1">
                  <label className="field-label text-xs font-semibold">Title Headline</label>
                  <input
                    type="text"
                    value={reason.title}
                    onChange={(e) => updateWhyUsField(index, "title", e.target.value)}
                    placeholder="e.g. Direct from Fishermen"
                    className="field-input text-sm p-3 rounded-xl bg-gray-50 focus:bg-surface focus:border-brand-500 border border-gray-200 w-full"
                  />
                </div>

                <div className="space-y-1 flex-1 flex flex-col">
                  <label className="field-label text-xs font-semibold">Short Description</label>
                  <textarea
                    value={reason.desc}
                    onChange={(e) => updateWhyUsField(index, "desc", e.target.value)}
                    placeholder="Provide a clear, brief explanation..."
                    className="field-input text-sm p-3 rounded-xl bg-gray-50 focus:bg-surface focus:border-brand-500 border border-gray-200 w-full flex-1 min-h-[120px] resize-none leading-relaxed"
                  />
                </div>
              </AdminCard>
            ))}
          </div>
        )}
      </div>
    </AdminPage>
  );
}
