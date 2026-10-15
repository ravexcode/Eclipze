import { useId } from "react";

interface Props {
  value: string;
  setValue: React.Dispatch<
    React.SetStateAction<string>
  >;
}

export default function AgentsInput(props: Props) {
  const inputId = useId();

  return (
    <>
      <label htmlFor={inputId} className="sr-only">Message the agent</label>
      <input
        id={inputId}
        type="text"
        value={props.value}
        onChange={(e) => {
          props.setValue(e.target.value);
        }}
        className="w-full rounded-md outline-hidden text-xs"
        placeholder="Ask me anything.." />
    </>
  )
}
