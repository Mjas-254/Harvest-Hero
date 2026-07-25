"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
        <input
          ref={ref}
          className={`w-full px-4 py-3 text-lg rounded-xl border-2 transition-colors outline-none ${
            error
              ? "border-red-300 focus:border-red-500"
              : "border-gray-200 focus:border-harvest-500"
          } ${className}`}
          {...props}
        />
        {hint && !error && (
          <p className="text-sm text-gray-400">{hint}</p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
