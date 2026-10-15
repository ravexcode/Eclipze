interface Props {
  value: string;
  setValue: React.Dispatch<
    React.SetStateAction<string>
  >;
}

export default function AgentsInput(props: Props) {
  return (
    <input
      type="text"
      value={props.value}
      onChange={(e) => {
        props.setValue(e.target.value);
      }}
      className="w-full rounded-md outline-hidden text-xs"
      placeholder="Ask me anything.." />
  )
}
