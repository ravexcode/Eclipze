interface Props {
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void | Promise<void>;
  onError: (e: React.SubmitEvent<HTMLFormElement>) => void;
  children?: React.ReactNode;
};

export default function AuthForm(props: Props) {
  return (
    <form
      onSubmit={props.onSubmit}
      onError={props.onError}
      className="flex w-full max-w-[360px] flex-col items-center justify-center gap-3 rounded-xs border border-background-focus bg-background-card px-6 py-7 animate-fade-in-up sm:px-8">
      {props.children}
    </form>
  );
}
