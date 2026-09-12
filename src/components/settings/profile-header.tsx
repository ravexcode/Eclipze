import type { SessionUser } from "@/types/user";

export default function ProfileHeader(props: {
  user: SessionUser | null;
  avatarUrl: string;
}) {
  return (
    props.user ?
      <section className="flex min-h-28 items-center gap-4 rounded-sm bg-background-card px-5 md:px-6">
        <img
          src={props.avatarUrl || '/logo.svg'}
          alt={props.user?.displayName ?? "User avatar"}
          className="h-14 w-14 shrink-0 rounded-full bg-background-focus object-cover"
        />
        <div className="min-w-0">
          <p className="truncate font-heading text-2xl leading-7 text-foreground">
            {props.user?.displayName ?? "Loading..."}
          </p>
          <p className="mt-1 truncate text-sm text-foreground-off">
            {props.user?.email ?? "Fetching your account details..."}
          </p>
        </div>
      </section> :
      <section className="flex min-h-28 items-center gap-4 rounded-sm bg-background-card px-5 md:px-6">
        <span className="h-14 w-14 shrink-0 rounded-full bg-background-focus object-cover animate-pulse" />
        <div className="w-full h-14 rounded-md bg-background-focus animate-pulse block" />
      </section>
  );
}
