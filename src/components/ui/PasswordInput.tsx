"use client";
import React, { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

export type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Text input with a toggle button to show / hide the password value.
 * Usage:
 * <PasswordInput id="password" value={value} onChange={...} />
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = "", ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={show ? "text" : "password"}
          {...props}
          className={`block w-full rounded-md bg-white/5 px-3 py-1.5 pr-10 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6 ${className}`}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200 focus:outline-none"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
