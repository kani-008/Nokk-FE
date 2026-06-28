
/**
 * Premium Toggle/Switch component.
 *
 * Props:
 *   checked   {boolean}  — active state
 *   onChange  {function} — click handler callback
 *   disabled  {boolean}  — optional disabled state
 */
export default function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onChange) onChange(e);
      }}
      disabled={disabled}
      aria-pressed={!!checked}
      className={`
        w-[36px] h-[20px] rounded-full relative shrink-0 transition-colors duration-200 outline-none
        before:absolute before:-inset-3 before:content-['']
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${checked 
          ? "bg-brand-700 hover:bg-brand-800 focus:ring-2 focus:ring-brand-500/20" 
          : "bg-gray-300 hover:bg-gray-400 focus:ring-2 focus:ring-gray-400/20"
        }
      `}
    >
      <span
        className={`
          absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm 
          transition-transform duration-200 ease-out
          ${checked ? "translate-x-4" : "translate-x-0"}
        `}
      />
    </button>
  );
}
