import { useState, useEffect } from "react";
import {
  Save, Loader2, Check, Palette, RotateCcw, ShoppingCart, Crosshair
} from "lucide-react";
import { AdminPage, AdminCard, AdminButton } from "../../components/admin/AdminUI.jsx";
import { RGBPicker, isValidHex } from "../../components/admin/ColorPicker.jsx";
import {
  applyTheme,
  applyBackgroundColor,
  applySurfaceColor,
  applyTextColor,
  resetTheme,
  resetBackgroundColor,
  resetSurfaceColor,
  resetTextColor
} from "../../components/Theme.js";
import API from "../../ApiCall/Api.jsx";

const DEFAULTS = {
  primaryColor: "",
  backgroundColor: "",
  surfaceColor: "",
  textColor: "",
};

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

function SectionCard({ icon: Icon, title, sub, children, className = "" }) {
  return (
    <AdminCard className={className}>
      <div className="flex items-start gap-2.5 mb-5 pb-4 border-b border-gray-100">
        <div className="p-2 rounded-xl bg-brand-50 shrink-0 mt-0.5"><Icon size={16} className="text-brand-700" /></div>
        <div>
          <h3 className="font-display text-base font-bold text-gray-900 leading-snug">{title}</h3>
          {sub && <p className="font-body text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      {children}
    </AdminCard>
  );
}

export default function Appearance() {
  const [form, setForm] = useState({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Track raw hex inputs for the text boxes
  const [primaryInput, setPrimaryInput] = useState("");
  const [bgInput, setBgInput] = useState("");
  const [surfaceInput, setSurfaceInput] = useState("");
  const [textInput, setTextInput] = useState("");

  useEffect(() => {
    settingsApi.get()
      .then((r) => {
        const s = { ...DEFAULTS, ...(r.settings || {}) };
        setForm(s);
        setPrimaryInput(s.primaryColor || "");
        setBgInput(s.backgroundColor || "");
        setSurfaceInput(s.surfaceColor || "");
        setTextInput(s.textColor || "");

        // Apply loaded colors to preview immediately on mount
        if (s.primaryColor) applyTheme(s.primaryColor);
        if (s.backgroundColor) applyBackgroundColor(s.backgroundColor);
        if (s.surfaceColor) applySurfaceColor(s.surfaceColor);
        if (s.textColor) applyTextColor(s.textColor);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const changeColor = (key, val, setInput, applyFn) => {
    setForm((f) => ({ ...f, [key]: val }));
    setInput(val);
    if (isValidHex(val)) {
      applyFn(val);
    }
  };

  const handleHexType = (key, raw, setInput, applyFn) => {
    setInput(raw);
    const v = raw.startsWith("#") ? raw : `#${raw}`;
    setForm((f) => ({ ...f, [key]: raw }));
    if (isValidHex(v)) {
      applyFn(v);
    }
  };

  const handleReset = (key, setInput, resetFn) => {
    setForm((f) => ({ ...f, [key]: "" }));
    setInput("");
    resetFn();
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError("");
    const data = { ...form };

    // Validations
    if (data.primaryColor && !isValidHex(data.primaryColor)) {
      setError("Primary Color must be a valid hex color");
      setSaving(false);
      return;
    }
    if (data.backgroundColor && !isValidHex(data.backgroundColor)) {
      setError("Background Color must be a valid hex color");
      setSaving(false);
      return;
    }
    if (data.surfaceColor && !isValidHex(data.surfaceColor)) {
      setError("Surface Color must be a valid hex color");
      setSaving(false);
      return;
    }
    if (data.textColor && !isValidHex(data.textColor)) {
      setError("Text Color must be a valid hex color");
      setSaving(false);
      return;
    }

    try {
      await settingsApi.update(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to save appearance");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPage title="Appearance">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-44 skeleton rounded-2xl" />)}
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      action={
        <AdminButton onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> :
           saved  ? <><Check   size={14} /> Saved!</>                           :
                    <><Save    size={14} /> Save Appearance</>}
        </AdminButton>
      }
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-body text-sm rounded-xl px-4 py-3 mb-5">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Theme Customization Controls ── */}
        <div className="space-y-6">
          {/* Primary Accent Color */}
          <SectionCard icon={Crosshair} title="Primary Accent Color" sub="Buttons, links, active state indicators">
            <div className="space-y-4">
              <RGBPicker
                value={form.primaryColor}
                defaultColor="#c2613a"
                onChange={(hex) => changeColor("primaryColor", hex, setPrimaryInput, applyTheme)}
              />
              <div className="flex items-center gap-3 pt-2">
                <div>
                  <label className="field-label">Custom hex</label>
                  <input
                    type="text"
                    value={primaryInput}
                    onChange={(e) => handleHexType("primaryColor", e.target.value, setPrimaryInput, applyTheme)}
                    placeholder="#c2613a"
                    className="field-input w-32 font-num"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleReset("primaryColor", setPrimaryInput, resetTheme)}
                  className="flex items-center gap-1.5 font-body text-xs text-gray-400 hover:text-gray-700 transition-colors mt-6"
                >
                  <RotateCcw size={12} /> Reset to default
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Background Color */}
          <SectionCard icon={Palette} title="Page Background Color" sub="Main storefront page background color">
            <div className="space-y-4">
              <RGBPicker
                value={form.backgroundColor}
                defaultColor="#faf7f0"
                onChange={(hex) => changeColor("backgroundColor", hex, setBgInput, applyBackgroundColor)}
              />
              <div className="flex items-center gap-3 pt-2">
                <div>
                  <label className="field-label">Custom hex</label>
                  <input
                    type="text"
                    value={bgInput}
                    onChange={(e) => handleHexType("backgroundColor", e.target.value, setBgInput, applyBackgroundColor)}
                    placeholder="#faf7f0"
                    className="field-input w-32 font-num"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleReset("backgroundColor", setBgInput, resetBackgroundColor)}
                  className="flex items-center gap-1.5 font-body text-xs text-gray-400 hover:text-gray-700 transition-colors mt-6"
                >
                  <RotateCcw size={12} /> Reset to default
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Surface Color */}
          <SectionCard icon={Palette} title="Surface / Card Color" sub="Card backgrounds, modal containers, and dropdown lists">
            <div className="space-y-4">
              <RGBPicker
                value={form.surfaceColor}
                defaultColor="#ffffff"
                onChange={(hex) => changeColor("surfaceColor", hex, setSurfaceInput, applySurfaceColor)}
              />
              <div className="flex items-center gap-3 pt-2">
                <div>
                  <label className="field-label">Custom hex</label>
                  <input
                    type="text"
                    value={surfaceInput}
                    onChange={(e) => handleHexType("surfaceColor", e.target.value, setSurfaceInput, applySurfaceColor)}
                    placeholder="#ffffff"
                    className="field-input w-32 font-num"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleReset("surfaceColor", setSurfaceInput, resetSurfaceColor)}
                  className="flex items-center gap-1.5 font-body text-xs text-gray-400 hover:text-gray-700 transition-colors mt-6"
                >
                  <RotateCcw size={12} /> Reset to default
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Text Color */}
          <SectionCard icon={Palette} title="Text / Body Color" sub="Main body text, headings, and description elements">
            <div className="space-y-4">
              <RGBPicker
                value={form.textColor}
                defaultColor="#22252c"
                onChange={(hex) => changeColor("textColor", hex, setTextInput, applyTextColor)}
              />
              <div className="flex items-center gap-3 pt-2">
                <div>
                  <label className="field-label">Custom hex</label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => handleHexType("textColor", e.target.value, setTextInput, applyTextColor)}
                    placeholder="#22252c"
                    className="field-input w-32 font-num"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleReset("textColor", setTextInput, resetTextColor)}
                  className="flex items-center gap-1.5 font-body text-xs text-gray-400 hover:text-gray-700 transition-colors mt-6"
                >
                  <RotateCcw size={12} /> Reset to default
                </button>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── Live Preview Panel ── */}
        <div>
          <div className="sticky top-6">
            <SectionCard icon={Palette} title="Live Storefront Preview" sub="Real-time rendering preview of appearance settings">
              <div
                className="w-full rounded-2xl p-6 border border-sandal-100 flex flex-col gap-6"
                style={{ backgroundColor: form.backgroundColor || "#faf7f0" }}
              >
                {/* Surface Card Component */}
                <div
                  className="rounded-2xl p-5 border border-sandal-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                  style={{ backgroundColor: form.surfaceColor || "#ffffff" }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="badge-amber text-[10px]">Featured Product</span>
                      <h4
                        className="font-display text-lg font-bold leading-tight mt-1"
                        style={{ color: form.textColor || "#22252c" }}
                      >
                        Paarai Karuvadu
                      </h4>
                    </div>
                    <span className="font-num text-sm font-bold" style={{ color: form.textColor || "#22252c" }}>
                      ₹350
                    </span>
                  </div>

                  <p className="font-body text-xs leading-relaxed mb-4" style={{ color: form.textColor || "#22252c", opacity: 0.8 }}>
                    Premium salt-cured Paarai dry fish. Sourced directly from Tuticorin harbor and sun-dried cleanly under hygienic conditions.
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button type="button" className="btn-md btn-primary text-xs flex items-center gap-1">
                      <ShoppingCart size={13} /> Add to Cart
                    </button>
                    <button type="button" className="btn-md btn-outline text-xs">
                      View Details
                    </button>
                  </div>
                </div>

                {/* Additional UI Elements */}
                <div
                  className="rounded-2xl p-5 border border-sandal-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-4"
                  style={{ backgroundColor: form.surfaceColor || "#ffffff" }}
                >
                  <div>
                    <h5
                      className="font-body text-sm font-bold mb-1"
                      style={{ color: form.textColor || "#22252c" }}
                    >
                      Quick Link Preview
                    </h5>
                    <p className="font-body text-xs" style={{ color: form.textColor || "#22252c", opacity: 0.8 }}>
                      Read our updated <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold underline" style={{ color: form.primaryColor || "#c2613a" }}>Privacy Policy</a> and <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold underline" style={{ color: form.primaryColor || "#c2613a" }}>Terms of Use</a> agreements.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: form.primaryColor || "#c2613a" }}>
                      ✓
                    </div>
                    <div>
                      <p className="font-body text-xs font-semibold" style={{ color: form.textColor || "#22252c" }}>
                        Free Shipping Applied!
                      </p>
                      <p className="font-body text-[10px]" style={{ color: form.textColor || "#22252c", opacity: 0.6 }}>
                        Your order qualifies for free delivery.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

      </div>

      {/* ── Bottom save bar ── */}
      <div className="flex items-center justify-between bg-surface border border-gray-100 rounded-2xl px-5 py-3.5 mt-6">
        <p className="font-body text-sm text-gray-500">
          {saved
            ? <span className="text-green-600 font-semibold flex items-center gap-1.5"><Check size={14} /> All changes saved</span>
            : "Unsaved changes will be lost on refresh"}
        </p>
        <AdminButton onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Appearance</>}
        </AdminButton>
      </div>
    </AdminPage>
  );
}
