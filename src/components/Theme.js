// ─────────────────────────────────────────────────────────────────────
// Runtime theming
// ─────────────────────────────────────────────────────────────────────
// Tailwind v4 exposes every @theme color as a CSS variable (e.g.
// --color-brand-700) and its utilities reference that variable, so we
// can recolour the whole site at runtime just by overriding those
// variables on :root. We take ONE base colour the admin picks and
// generate a full 50–900 scale from its hue/saturation.
//
// IMPORTANT: this only works if index.css defines the brand palette with
// a plain `@theme { … }` block (the v4 default). If you used
// `@theme inline { … }`, Tailwind bakes the literal colour into each
// utility and there is no variable to override — switch it to plain
// `@theme` for runtime theming to take effect.

// shade → target lightness (%). Anchored so the picked hue reads as the
// primary (~700) the admin UI uses most.
const SHADE_LIGHTNESS = {
  50: 96, 100: 92, 200: 84, 300: 73, 400: 60,
  500: 50, 600: 43, 700: 36, 800: 28, 900: 20,
};
const SHADES = Object.keys(SHADE_LIGHTNESS);

function hexToHsl(hex) {
  let h = String(hex).replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const lig = (max + min) / 2;
  let hue = 0, sat = 0;
  const d = max - min;
  if (d !== 0) {
    sat = lig > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      default: hue = (r - g) / d + 4;
    }
    hue /= 6;
  }
  return { h: hue * 360, s: sat * 100, l: lig * 100 };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

const isValidHex = (hex) => /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(hex || "").trim());

export function generatePalette(baseHex) {
  const { h, s } = hexToHsl(baseHex);
  const sat = Math.max(s, 25); // keep some chroma so greys don't wash out
  const palette = {};
  for (const shade of SHADES) palette[shade] = hslToHex(h, sat, SHADE_LIGHTNESS[shade]);
  return palette;
}

export function applyTheme(baseHex) {
  if (!isValidHex(baseHex)) return;
  const { h, s } = hexToHsl(baseHex);
  const brandSat = Math.max(s, 25);

  const root = document.documentElement;
  for (const shade of SHADES) {
    const brandHex = hslToHex(h, brandSat, SHADE_LIGHTNESS[shade]);
    root.style.setProperty(`--color-brand-${shade}`, brandHex);
  }
}

// Removes the runtime overrides so the site falls back to the palette
// defined in index.css.
export function resetTheme() {
  const root = document.documentElement;
  for (const shade of SHADES) {
    root.style.removeProperty(`--color-brand-${shade}`);
  }
}

export function applyBackgroundColor(hex) {
  if (!isValidHex(hex)) return;
  const root = document.documentElement;
  root.style.setProperty("--bg-page", hex.startsWith("#") ? hex : `#${hex}`);
}

export function resetBackgroundColor() {
  const root = document.documentElement;
  root.style.removeProperty("--bg-page");
}

export function applySurfaceColor(hex) {
  if (!isValidHex(hex)) return;
  const root = document.documentElement;
  root.style.setProperty("--color-surface", hex.startsWith("#") ? hex : `#${hex}`);
}

export function resetSurfaceColor() {
  const root = document.documentElement;
  root.style.removeProperty("--color-surface");
}

export function applyTextColor(hex) {
  if (!isValidHex(hex)) return;
  const root = document.documentElement;
  root.style.setProperty("--color-gray-800", hex.startsWith("#") ? hex : `#${hex}`);
}

export function resetTextColor() {
  const root = document.documentElement;
  root.style.removeProperty("--color-gray-800");
}

export { isValidHex };