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
      className={"relative flex rounded-lg bg-background-card p-1 px-3 w-max items-center justify-center cursor-default text-center text-sm hover:cursor-pointer " + (!expanded && "hover:bg-background-focus duration-300")}
      onClick={() => setExpanded(prev => !prev)}>

      {props.current}

      {
        expanded &&
        <div
          className="absolute top-1/1 left-0 rounded-lg flex flex-col items-center justify-start bg-background-card border border-background-focus p-2 overflow-auto max-h-40 w-50 text-start">
          {
            props.values.map((value, index) =>
              <span
                onClick={() => {
                  props.setCurrent(value);
                }}
                key={index}
                className={"w-full p-1 px-3 rounded-lg hover:bg-background-focus duration-300 hover:cursor-pointer " + (value === props.current && "bg-background-focus")}>

                {value}

              </span>
            )
          }
        </div>
      }
    </section>
  );
}
