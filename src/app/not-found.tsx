import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center animate-blurred-fade-in">
      <p
        className="font-heading text-8xl font-normal tracking-[-0.08em] text-foreground">
        404
      </p>
      <p
        className="font-base text-2xl font-medium tracking-[-0.03em]">
        Page not found
      </p>

      <p
        className="max-w-md text-sm leading-6 text-foreground-off">
        The page you were looking for does not exist or an error occurred. Go back or return to <Link
          href="/"
          className="font-medium text-foreground underline transition-colors hover:text-accent" >
          Home
        </Link>
      </p>
    </div>
  )
}
