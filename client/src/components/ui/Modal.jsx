import { useEffect } from "react";

const Modal = ({ isOpen, open, onClose, title, children }) => {
  const visible = isOpen ?? open;

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const handler = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[#2f2924]/30 backdrop-blur-[6px]"
        onClick={onClose}
      />
      <div
        aria-modal="true"
        className="soft-panel relative z-10 mx-4 w-full max-w-[640px] p-6 sm:p-7"
        role="dialog"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="soft-display text-2xl tracking-tight text-[#4d463f]">
            {title}
          </h3>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8ccbf] bg-[#fffaf4] text-lg leading-none text-[#7a6f63] transition hover:bg-[#f2eadf] hover:text-[#4d463f]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
