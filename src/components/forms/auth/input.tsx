"use client";

import { useState } from "react";

import {
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";

interface Props {
  type: "text" | "password" | "email";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  placeholder?: string;
  pattern?: string;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  disabled?: boolean;
}

export default function Input(props: Props) {
  const [visible, setVisible] = useState(false);

  const inputClass = "w-full rounded-xs border border-transparent bg-background-focus px-3 py-2.5 text-sm text-foreground outline-hidden transition-colors placeholder:text-foreground-off/70 focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div
      className="relative flex w-full flex-col items-center justify-center gap-1.5 text-sm">
      <label
        className="w-full text-start text-xs text-foreground-off">
        {props.label}
      </label>
      {props.type === "password" ?
        <>
          <input
            type={visible ? "text" : "password"}
            value={props.value}
            onChange={props.onChange}
            placeholder={props.placeholder}
            pattern={props.pattern}
            autoComplete={props.autoComplete}
            maxLength={props.maxLength}
            minLength={props.minLength}
            required={props.required}
            disabled={props.disabled}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute bottom-2.5 right-2 rounded-xs p-0.5 text-foreground-off outline-hidden transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-accent">
            {
              visible ?
                <IconEyeOff
                  size={18} /> :
                <IconEye
                  size={18} />
            }
          </button>
        </>
        :
          <input
            type={props.type}
            value={props.value}
            onChange={props.onChange}
            placeholder={props.placeholder}
            pattern={props.pattern}
            autoComplete={props.autoComplete}
            maxLength={props.maxLength}
            minLength={props.minLength}
            required={props.required}
            disabled={props.disabled}
            className={inputClass}
          />
        }
    </div>
  );
}
