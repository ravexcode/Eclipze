interface Props {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onError: (e: React.FormEvent<HTMLFormElement>) => void;
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
