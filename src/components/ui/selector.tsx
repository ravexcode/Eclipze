"use client";

import { useState } from "react";

interface Props {
  current: string;
  setCurrent: React.Dispatch<
    React.SetStateAction<string>
  >;
  values: string[];
  width?: string;
}

export default function SelectorInput(props: Props) {
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <section
      className={`rounded-sm hover:bg-background-focus bg-background-card p-1 text-sm relative cursor-default text-center flex ${props.width}`}
      onClick={() => setExpanded(prev => prev ? false : true)}>
      {props.current}

      {
        expanded &&
        <div
          className="w-full rounded-sm flex flex-col items-center justify-center absolute top-1/1 max-h-40 overflow-auto bg-background-card py-2">
          {
            props.values.map((value, index) =>
              <span
                key={index}
                className={`w-full px-2 py-1 cursor-default ${value === props.current ? "bg-background-focus" : "hover:bg-background-focus/50"}`}>
                {value}
              </span>
            )
          }
        </div>
      }
    </section>
  )
}
