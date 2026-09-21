interface Props {
  value: string;
  setValue: React.Dispatch<
    React.SetStateAction<string>
  >;
}

export default function AgentsInput(props: Props) {
  return (
    <textarea
      value={props.value}
      onChange={(e) => {
        props.setValue(e.target.value);
      }}
      className="w-full rounded-sm outline-none text-sm min-h-10 max-h-50 resize-none"
      placeholder="Ask me anything.." />
  )
}
