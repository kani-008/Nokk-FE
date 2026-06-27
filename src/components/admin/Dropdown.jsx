import { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check } from "lucide-react";

/*
  Dropdown — custom select replacing native <select>.

  Why: native <select> styling can't be controlled cross-browser (the
  dropdown panel itself ignores most CSS), and the option list looks
  inconsistent between OSes. This renders its own panel so it always
  matches the rest of the admin UI.

  Props:
    value        {string}      — currently selected option's value
    onChange     {fn(value)}
    options       {array}       — [{ value, label }]
    placeholder  {string}      — shown when value is empty
    error        {boolean}     — switches to the red error style
    disabled     {boolean}
    className    {string}      — extra classes for the trigger button
    optionClassName {fn(opt) => string} — optional per-option className
      (e.g. to render Tamil labels in font-tamil)
*/
export default function Dropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  error = false,
  disabled = false,
  className = "",
  optionClassName,
  direction = "down",
}) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const listboxId = useId();

  const selected = options.find((o) => o.value === value);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // reset keyboard-active index to the current selection whenever opened
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setActiveIdx(idx >= 0 ? idx : 0);
    }
  }, [open, value, options]);

  // keep the keyboard-active option scrolled into view
  useEffect(() => {
    if (!open || activeIdx < 0) return;
    const el = listRef.current?.children?.[activeIdx];
    el?.scrollIntoView({ block: "nearest" });
  }, [open, activeIdx]);

  const commit = (opt) => {
    onChange(opt.value);
    setOpen(false);
  };

  const handleTriggerKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleListKeyDown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, options.length - 1)); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); return; }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options[activeIdx]) commit(options[activeIdx]);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
        className={`
          w-full flex items-center justify-between gap-2 rounded-md border-[1.5px] bg-white px-4 py-2.5 text-sm
          text-left outline-none transition-all duration-200
          ${error
            ? "border-red-300 focus:border-red-400 focus:ring-3 focus:ring-red-400/15"
            : "border-gray-200 focus:border-sandal-400 focus:ring-3 focus:ring-sandal-400/15"}
          ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer hover:border-gray-300"}
          ${className}
        `}
      >
        <span className={`truncate ${selected ? "text-gray-800" : "text-gray-400"} ${selected && optionClassName ? optionClassName(selected) : ""}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} className={`shrink-0 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
          className={`absolute z-30 w-full max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg focus:outline-none ${direction === "up" ? "bottom-full mb-1.5" : "mt-1.5"}`}
        >
          {options.length === 0 && (
            <li className="px-4 py-2.5 font-body text-sm text-gray-400">No options</li>
          )}
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isActive   = idx === activeIdx;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => commit(opt)}
                className={`
                  flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-body cursor-pointer truncate
                  ${isActive ? "bg-sandal-50" : ""}
                  ${isSelected ? "text-sandal-700 font-semibold" : "text-gray-700"}
                  ${optionClassName ? optionClassName(opt) : ""}
                `}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={14} className="shrink-0 text-sandal-600" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}