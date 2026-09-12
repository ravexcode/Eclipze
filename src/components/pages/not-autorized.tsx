import MarketingLayout from "@/components/layouts/marketing";
import Link from "next/link";

export default function NotAuthorizedPage() {
  return (
    <MarketingLayout>
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-2 p-10">
        <p
          className="font-bold text-4xl text-center w-full font-heading">
          Not authorized
        </p>
        <p
          className="text-lg text-foreground-off w-full text-center">
          You are not authorized to access to this page <br />
          return to the <Link
            href="/"
            className="underline duration-300 hover:text-accent">
            Home page
          </Link>
        </p>
      </div>
    </MarketingLayout>
  )
}
