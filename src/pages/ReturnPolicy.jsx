import SEO from "../components/seo/SEO.jsx";
import { usePublicSettings } from "../hookqueries/useSettings";
import ReactMarkdown from "react-markdown";

const DEFAULT_RETURN = `## 1. Our Return Policy
Because dry fish, pickles, and seafood are perishable, natural products, we do not accept returns or exchanges once an order has been delivered and accepted, except in the specific cases below.

## 2. Damaged, Incorrect, or Missing Items
If your order arrives damaged, incorrect, or with missing items, please contact us within **24 hours of delivery** with clear photographs of the product and packaging. This short window is necessary given the perishable nature of our products — claims reported after 24 hours cannot be honored.

## 3. What's Not Eligible for Return
* Products that have been opened, used, or partially consumed
* Change-of-mind returns (taste/quality preference alone is not grounds for return, since these are natural, traditionally-prepared products with authentic variation)
* Delays or issues caused by an incorrect address provided at checkout

## 4. Refund Method & Timeline
Approved refunds are issued to the original payment method within **5-7 business days** of approval. For Cash on Delivery orders, refunds are processed via UPI/bank transfer to the details you provide.

## 5. Replacements
For eligible cases (damaged/incorrect/missing items reported within 24 hours), we prefer offering a replacement of the affected item where possible, or a full refund if a replacement isn't feasible.

## 6. How to Request a Return or Refund
Contact us via WhatsApp or email with your Order ID, a description of the issue, and photos — our support team will review and respond within 24-48 hours.

## 7. Storage Note
For best quality after delivery, store dry fish in a cool, dry, well-ventilated place, in an airtight container, away from direct sunlight and moisture — proper storage helps preserve freshness and flavor.`;

export default function ReturnPolicy() {
  const { data: settings = {} } = usePublicSettings();
  const returnContent = settings.returnContent;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <SEO
        title="Return & Refund Policy — Namma Oor Karuvattu Kadai"
        description="Return & Refund Policy for Namma Oor Karuvattu Kadai. Learn when returns are accepted, how refunds are processed, and how to report an issue with your order."
        url="https://nammaoorkaruvattukadai.com/return-policy"
      />

      <div className="bg-surface rounded-2xl border border-amber-100 p-6 sm:p-10 shadow-sm">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 mb-2">
          Return & Refund Policy
        </h1>
        <p className="font-body text-xs text-amber-600 mb-8 uppercase tracking-wider">
          Last updated: July 15, 2026
        </p>

        <div className="space-y-4 [&_h2]:font-display [&_h2]:text-lg [&_h2]:sm:text-xl [&_h2]:font-bold [&_h2]:text-brand-900 [&_h2]:mb-3 [&_h2]:mt-6 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-brand-950 [&_a]:text-brand-900 [&_a]:underline [&_a]:hover:text-amber-600 [&_a]:transition-colors">
          <ReactMarkdown>
            {returnContent || DEFAULT_RETURN}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
