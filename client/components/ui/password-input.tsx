import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  id?: string;
  required?: boolean;
  "aria-label"?: string;
}

/**
 * Reusable password input component with show/hide toggle
 * Matches existing input styling from onboarding forms
 */
export function PasswordInput({
  value,
  onChange,
  placeholder = "Enter your password",
  error,
  className,
  id,
  required = false,
  "aria-label": ariaLabel,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-label={ariaLabel || (showPassword ? "Password (visible)" : "Password (hidden)")}
        className={cn(
          "w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none pr-12",
          error
            ? "border-red-300 bg-red-50/50"
            : "border-slate-200 bg-white/50 focus:border-indigo-500 focus:bg-white",
          className
        )}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none transition-colors"
        aria-label={showPassword ? "Hide password" : "Show password"}
        tabIndex={0}
      >
        {showPassword ? (
          <EyeOff className="h-5 w-5 transition-opacity" />
        ) : (
          <Eye className="h-5 w-5 transition-opacity" />
        )}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

