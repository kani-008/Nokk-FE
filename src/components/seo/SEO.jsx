import { Helmet } from "react-helmet-async";

export default function SEO({
  title,
  description,
  image,
  url,
  type = "website",
  canonical,
  noindex = false,
  schemas = []
}) {
  const SITE_URL = "https://nammaoorkaruvattukadai.com";
  const defaultTitle = "Buy Dry Fish Online — Karuvadu, Pickles & Seafood | Namma Oor Karuvattu Kadai";
  const defaultDesc = "Shop premium sun-dried karuvadu (dry fish), traditional pickles — சுவை மிக்க கருவாடு மற்றும் ஊறுகாய் — sourced directly and delivered across Tamil Nadu.";
  const defaultImage = `${SITE_URL}/og-home.jpg`;

  const finalTitle = title || defaultTitle;
  const finalDesc = description || defaultDesc;
  const finalImage = image || defaultImage;
  const finalUrl = url || SITE_URL;
  const finalCanonical = canonical || finalUrl;

  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />

      {/* Robots meta */}
      <meta name="robots" content={noindex ? "noindex,follow" : "index,follow"} />

      {/* Canonical Link */}
      <link rel="canonical" href={finalCanonical} />

      {/* OpenGraph Card */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:type" content={type} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDesc} />
      <meta name="twitter:image" content={finalImage} />

      {/* JSON-LD Schemas */}
      {schemas.filter(Boolean).map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
