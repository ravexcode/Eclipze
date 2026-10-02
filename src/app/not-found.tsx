import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-1 px-6 text-center animate-blurred-fade-in">
      <p
        className="font-base text-7xl font-bold tracking-[-0.07em] text-foreground">
        404
      </p>
      <p
        className="font-base text-4xl font-semibold leading-none tracking-[-0.03em]">
        Page not found
      </p>

      <p
        className="mt-2 max-w-sm text-sm leading-5 text-foreground-off">
        The page you were looking for does not exist or an error occurred. Go back or return to <Link
          href="/"
          className="font-medium text-foreground underline transition-colors hover:text-accent" >
          Home
        </Link>
      </p>
    </div>
  )
}
