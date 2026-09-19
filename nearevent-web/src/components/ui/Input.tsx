import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Input({ label, error, className = "", ...props }: Props) {
  return (
    <div className="w-full">
      {label ? (
        <label className="mb-1.5 block text-sm text-text-secondary">
          {label}
        </label>
      ) : null}
      <input
        className={`border border-border-default focus:border-border-focus w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-brand-primary ${
          error ? "border-status-error" : "border-gray-300"
        } ${className}`}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-status-error">{error}</p> : null}
    </div>
  );
}