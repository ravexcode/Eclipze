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
      className="flex w-full max-w-[329px] flex-col items-center justify-center gap-3 animate-fade-in-up">
      {props.children}
    </form>
  );
}
