"use client";

import { useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";

import { INPUT_BASE_CLASSES, INPUT_PASSWORD_TOGGLE_CLASSES } from "@/constants/input";

type FieldProps = {
  value: string;
  onChange(value: string): void;
  className?: string;
};

type TextInputProps = FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "className"> & {
  type?: "text" | "email" | "url" | "search" | "password";
};

type TextareaProps = FieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "className"> & {
  type: "textarea";
};

type Props = TextInputProps | TextareaProps;

export default function Input(props: Props) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  if (props.type === "textarea") {
    const { type: _type, value, onChange, className = "w-full", rows = 4, ...textareaProps } = props;

    return (
      <textarea
        {...textareaProps}
        rows={rows}
        value={value}
        onChange={event => onChange(event.target.value)}
        className={`${INPUT_BASE_CLASSES} resize-y ${className}`}
      />
    );
  }

  const { type = "text", value, onChange, className = "w-full", ...inputProps } = props;

  if (type !== "password") {
    return (
      <input
        {...inputProps}
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        className={`${INPUT_BASE_CLASSES} ${className}`}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <input
        {...inputProps}
        type={isPasswordVisible ? "text" : "password"}
        value={value}
        onChange={event => onChange(event.target.value)}
        className={`${INPUT_BASE_CLASSES} w-full pr-9`}
      />
      <button
        type="button"
        onClick={() => setIsPasswordVisible(visible => !visible)}
        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
        className={INPUT_PASSWORD_TOGGLE_CLASSES}>
        {isPasswordVisible ? (
          <IconEyeOff size={18} />
        ) : (
          <IconEye size={18} />
        )}
      </button>
    </div>
  );
}
