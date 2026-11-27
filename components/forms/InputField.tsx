import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

const InputField = ({
  name,
  label,
  placeholder,
  type = "text",
  register,
  error,
  validation,
  disabled,
  value,
  showPasswordToggle,
}: FormInputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = type === "password";
  const canTogglePassword = showPasswordToggle ?? isPasswordField;
  const inputType = canTogglePassword
    ? isPasswordVisible
      ? "text"
      : "password"
    : type;

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="form-label">
        {label}
      </Label>
      <div className="relative">
        <Input
          type={inputType}
          id={name}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          className={cn("form-input", {
            "opacity-50 cursor-not-allowed": disabled,
            "pr-10": canTogglePassword,
          })}
          {...register(name, validation)}
        />
        {canTogglePassword && (
          <button
            type="button"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            aria-pressed={isPasswordVisible}
            onClick={() => setIsPasswordVisible((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition-colors"
          >
            {isPasswordVisible ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={`${name}-error`} role="alert" className="text-sm text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
};
export default InputField;
