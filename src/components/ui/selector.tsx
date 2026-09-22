"use client";

import { useState } from "react";

interface Props {
  current: string;
  setCurrent: React.Dispatch<
    React.SetStateAction<string>
  >;
  values: string[];
  width: string;
}

export default function SelectorInput(props: Props) {
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <section
      className="relative flex rounded-sm bg-background-card text-center text-sm">
      <button
        type="button"
        aria-expanded={expanded}
        aria-haspopup="listbox"
        className="w-full cursor-pointer rounded-sm hover:bg-background-focus focus-visible:outline-1 focus-visible:outline-accent py-1 px-2"
        onClick={() => setExpanded(prev => !prev)}>
        {props.current}
      </button>

      {
        expanded &&
        <div
          role="listbox"
          aria-label="Select a model"
          className={`absolute top-full left-0 z-10 flex max-h-40 ${props.width} flex-col items-center justify-center overflow-auto rounded-sm bg-background-card py-2 px-4`}>
          {
            props.values.map((value, index) =>
              <button
                type="button"
                key={index}
                role="option"
                aria-selected={value === props.current}
                className={`w-full cursor-pointer px-2 py-1 text-start ${value === props.current ? "bg-background-focus" : "hover:bg-background-focus/50"}`}
                onClick={() => {
                  props.setCurrent(value);
                  setExpanded(false);
                }}>
                {value}
              </button>
            )
          }
        </div>
      }
    </section>
  );
}
