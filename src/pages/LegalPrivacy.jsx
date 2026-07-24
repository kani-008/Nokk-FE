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

        <div className="space-y-4 [&_h2]:font-display [&_h2]:text-lg [&_h2]:sm:text-xl [&_h2]:font-bold [&_h2]:text-brand-900 [&_h2]:mb-3 [&_h2]:mt-6 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-brand-950 [&_a]:text-brand-900 [&_a]:underline [&_a]:hover:text-amber-600 [&_a]:transition-colors">
          <ReactMarkdown>
            {privacyContent || ""}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
