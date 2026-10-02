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

  const inputClass = "h-12 w-full rounded-md border border-transparent bg-background-focus px-3 text-[18px] text-foreground outline-hidden transition-colors placeholder:text-foreground-off/70 focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div
      className="relative flex w-full flex-col items-center justify-center gap-1.5 text-[18px]">
      <label
        className="w-full text-start text-[15px] text-foreground">
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
            className="absolute bottom-2 right-3 rounded-xs p-1 text-foreground-off outline-hidden transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-accent">
            {
              visible ?
                <IconEyeOff
                  size={27} /> :
                <IconEye
                  size={27} />
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
