interface Props {
  label: string;
}

export default function Heading(props: Props) {
  return (
    <header
      className="flex h-max w-full items-center border-b border-background-focus px-5 py-4 font-base text-2xl font-normal leading-8 tracking-[-0.02em] text-start sm:px-8">
      {props.label}
    </header>
  )
}
