interface Props {
  label: string;
}

export default function Heading(props: Props) {
  return (
    <header
      className="w-full border-b border-background-focus font-medium text-2xl text-start p-4 font-heading h-max">
      {props.label}
    </header>
  )
}
