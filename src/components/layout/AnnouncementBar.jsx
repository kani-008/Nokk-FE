import { useMemo } from "react";
import { useActiveOffers } from "../../hookqueries/useOffers";

// ─── build a short display label per offer ───────────────────────────────────
function buildLabel(offer) {
  const discVal = parseFloat(offer.discountValue || 0);
  const discountText =
    offer.offerType === "percentage" ? `${discVal}% OFF` : `₹${discVal} OFF`;

  let scope = "Everything";
  if (offer.appliesTo === "product" && offer.productName) scope = offer.productName;
  else if (offer.appliesTo === "category" && offer.categoryName) scope = offer.categoryName;

  const hasEndDate = offer.endDate && offer.endDate !== "";
  const endText = hasEndDate
    ? ` · Ends ${new Date(offer.endDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })}`
    : "";

  return `🔥 ${discountText} on ${scope}${endText}`;
}

// separator between items
const SEP = "     ✦     ";

// 8 copies → animate -12.5% = exactly one unit width → seamless loop, no blank edge ever
const COPIES = 8;

export default function AnnouncementBar({ settings }) {
  const { data: offers = [] } = useActiveOffers();

  const labels = useMemo(() => {
    const live = offers.filter((o) => o.isLive);
    if (live.length > 0) return live.map(buildLabel);

    const fallback = settings?.announcementText?.trim();
    if (fallback) return [fallback];

    return [];
  }, [offers, settings]);

  if (labels.length === 0) return null;

  // One "unit" — all labels joined, trailing separator keeps spacing uniform at wrap
  const unitText = labels.join(SEP) + SEP;

  // ~0.22s per character, clamped 8–35s
  const duration = Math.min(35, Math.max(8, Math.round(unitText.length * 0.22)));

  return (
    // Full-bleed ticker — parent (NavBar) owns bg + overflow-hidden
    <div
      className="w-full py-[5px] select-none"
      aria-label="Announcements"
    >
      {/*
        4 identical copies rendered inline.
        translateX(-25%) shifts exactly one copy → seamless infinite loop.
        Whole screen is always covered — no blank left or right edge.
      */}
      <div
        className="flex whitespace-nowrap w-max will-change-transform"
        style={{
          animation: `announcement-scroll ${duration}s linear infinite`,
        }}
      >
        {Array.from({ length: COPIES }).map((_, i) => (
          <span
            key={i}
            className="text-[11px] text-sandal-200/75 font-body font-medium tracking-wide"
            aria-hidden={i > 0 ? "true" : undefined}
          >
            {unitText}
          </span>
        ))}
      </div>
    </div>
  );
}
