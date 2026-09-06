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
  const [ visible, setVisible ] = useState(false);

  const inputClass = "w-full px-3 py-2 rounded-sm bg-background-focus outline-none border border-transparent focus:border-accent duration-300";

  return (
    <div
      className="w-full flex flex-col items-center justify-center gap-1 text-sm relative">
      <label
        className="w-full text-start">
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
            className="absolute right-2 bottom-2.5 outline-none">
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
