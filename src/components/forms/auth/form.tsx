interface Props {
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  onError: (e: React.SubmitEvent<HTMLFormElement>) => void;
  children?: React.ReactNode;
};

export default function AuthForm(props: Props) {
  return (
    <form
      onSubmit={props.onSubmit}
      onError={props.onError}
      className="w-95 px-4 py-6 flex flex-col items-center justify-center gap-2 animate-fade-in-up">
      {props.children}
    </form>
  );
}
