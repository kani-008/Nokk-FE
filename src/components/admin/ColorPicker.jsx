import { useState } from "react";

// ── Color helpers ─────────────────────────────────────────────────────
export const hexToRgb = (hex = "") => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 255, g: 255, b: 255 };
};

export const rgbToHex = (r, g, b) =>
  `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;

export const isValidHex = (hex) => /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(hex || "").trim());

// ── RGB Slider ─────────────────────────────────────────────────────────
const CH_META = {
  r: { label: "R", dot: "bg-red-500",   text: "text-red-500",   accent: "#ef4444" },
  g: { label: "G", dot: "bg-green-500", text: "text-green-500", accent: "#22c55e" },
  b: { label: "B", dot: "bg-blue-500",  text: "text-blue-500",  accent: "#3b82f6" },
};

export function RGBSlider({ channel, value, baseRgb, onChange }) {
  const meta = CH_META[channel];

  // build a gradient that keeps the other two channels fixed while this one sweeps
  const from = rgbToHex(
    channel === "r" ? 0   : baseRgb.r,
    channel === "g" ? 0   : baseRgb.g,
    channel === "b" ? 0   : baseRgb.b,
  );
  const to = rgbToHex(
    channel === "r" ? 255 : baseRgb.r,
    channel === "g" ? 255 : baseRgb.g,
    channel === "b" ? 255 : baseRgb.b,
  );

  return (
    <div className="flex items-center gap-3">
      <span className={`font-num text-xs font-extrabold w-4 shrink-0 ${meta.text}`}>{meta.label}</span>
      <div className="relative flex-1 h-4 flex items-center">
        {/* gradient track */}
        <div
          className="absolute inset-x-0 h-2 rounded-full pointer-events-none"
          style={{ background: `linear-gradient(to right, ${from}, ${to})` }}
        />
        <input
          type="range" min={0} max={255} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ accentColor: meta.accent }}
          className="relative w-full h-2 rounded-full appearance-none bg-transparent cursor-pointer"
        />
      </div>
      <input
        type="number" min={0} max={255} value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(255, Number(e.target.value))))}
        className="w-14 text-center font-num text-xs border border-gray-200 rounded-lg py-1 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
      />
    </div>
  );
}

export function RGBPicker({ label, value, onChange, defaultColor = "#ffffff" }) {
  const rgb = hexToRgb(value || defaultColor);

  const update = (ch, val) => {
    const next = { ...rgb, [ch]: val };
    onChange(rgbToHex(next.r, next.g, next.b));
  };

  const hexDisplay = value || defaultColor;

  return (
    <div className="space-y-3">
      {label && <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>}

      <div className="flex items-start gap-4">
        {/* big swatch */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div
            className="w-14 h-14 rounded-xl border border-gray-200 shadow-sm cursor-pointer relative overflow-hidden"
            style={{ backgroundColor: hexDisplay }}
          >
            <input
              type="color"
              value={hexDisplay}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              title="Pick from colour wheel"
            />
          </div>
          <span className="font-num text-[10px] text-gray-400 uppercase">{hexDisplay}</span>
        </div>

        {/* sliders */}
        <div className="flex-1 space-y-2.5">
          <RGBSlider channel="r" value={rgb.r} baseRgb={rgb} onChange={(v) => update("r", v)} />
          <RGBSlider channel="g" value={rgb.g} baseRgb={rgb} onChange={(v) => update("g", v)} />
          <RGBSlider channel="b" value={rgb.b} baseRgb={rgb} onChange={(v) => update("b", v)} />
        </div>
      </div>

      {/* quick whites / neutrals */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {["#ffffff", "#f9fafb", "#f1f5f4", "#faf7f0", "#fff8f0", "#f5f0ff", "#f0fff4"].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            title={c}
            style={{ backgroundColor: c }}
            className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${value?.toLowerCase() === c ? "ring-2 ring-offset-1 ring-gray-700 border-gray-300" : "border-gray-200"}`}
          />
        ))}
        <span className="font-body text-[10px] text-gray-400 ml-1">Quick picks</span>
      </div>
    </div>
  );
}
