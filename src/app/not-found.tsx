import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 min-h-dvh text-center animate-blurred-fade-in">
      <p
        className="font-heading text-8xl font-bold">
        404
      </p>
      <p
        className="text-3xl font-medium font-base">
          Page not found
      </p>

      <p
        className="text-foreground-off">
        The page for that was you searching doesn’t exists <br />
        or an error ocurred. Go back or return to <Link
          href="/"
          className="underline duration-300 font-medium hover:text-accent" >
          Home
        </Link>
      </p>
    </div>
  )
}
