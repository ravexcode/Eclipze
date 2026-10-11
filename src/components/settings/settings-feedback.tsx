export default function SettingsFeedback(props: {
  error: string | null;
  message: string | null;
}) {
  return (
    <>
      {props.error ? (
        <p className="text-base text-red-400">{props.error}</p>
      ) : null}
      {props.message ? (
        <p className="text-base text-green-400">{props.message}</p>
      ) : null}
    </>
  );
}
