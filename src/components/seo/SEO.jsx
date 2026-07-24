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
  const defaultTitle = "Namma Oor Karuvattu Kadai";
  const defaultDesc = "Shop premium sun-dried karuvadu (dry fish), traditional pickles — சுவை மிக்க கருவாடு மற்றும் ஊறுகாய் — sourced directly and delivered across Tamil Nadu.";
  // No dedicated /og-home.jpg asset exists yet — fall back to a live admin-uploaded
  // hero banner image so og:image is never a broken link. Swap for a real designed
  // OG asset once one exists; this banner can be replaced/deleted from the admin panel.
  const defaultImage = "./logo2.png"

  const finalTitle = title || defaultTitle;
  const finalDesc = description || defaultDesc;
  const rawImage = image || defaultImage;
  const finalImage = rawImage?.startsWith("http")
    ? rawImage
    : `${SITE_URL}${rawImage?.startsWith(".") ? rawImage.slice(1) : rawImage?.startsWith("/") ? rawImage : "/" + rawImage}`;
  const finalUrl = url || SITE_URL;
  const finalCanonical = canonical || finalUrl;

  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />
      <link rel="icon" type="image/png" href="/fav.png" />

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
