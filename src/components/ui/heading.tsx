interface Props {
  label: string;
}

export default function Heading(props: Props) {
  return (
    <header
      className="w-full border-b border-background-focus px-4 py-3 font-base text-2xl font-normal leading-8 tracking-[-0.02em] text-start h-max">
      {props.label}
    </header>
  )
}
