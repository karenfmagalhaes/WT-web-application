const variants = {
  primary:
    "border border-[#4b4743] bg-[#4b4743] text-[#fffaf4] shadow-[0_12px_24px_rgba(75,71,67,0.16)] hover:border-[#383430] hover:bg-[#383430]",
  outline:
    "border border-[#d4c7b8] bg-[#fffaf4] text-[#5a5148] hover:border-[#c4b19c] hover:bg-[#f2eadf]",
  secondary:
    "border border-[#e0d4c7] bg-[#f1e7da] text-[#5e564e] hover:border-[#d3c1ad] hover:bg-[#e9ddd0]",
  danger:
    "border border-[#e4c7bf] bg-[#fff2ee] text-[#9a5c49] hover:border-[#d7b0a5] hover:bg-[#f7e7e0]",
  ghost: "text-[#6b6158] hover:bg-[#f3eadf]",
};

const sizes = {
  md: "px-5 py-2.5 text-sm",
  small: "px-4 py-2 text-sm",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[0.08em] transition focus:outline-none focus:ring-4 focus:ring-[#ddcdb8]/60 disabled:cursor-not-allowed disabled:opacity-50 ${
      sizes[size] ?? sizes.md
    } ${variants[variant] ?? variants.primary} ${className}`}
    type={type}
  >
    {children}
  </button>
);

export default Button;
