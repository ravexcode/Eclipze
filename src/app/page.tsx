import MarketingLayout from "@/components/layouts/marketing";
import Image from "next/image";

export default function HomePage() {
  return (
    <MarketingLayout>
      <section
        className="absolute -z-1 w-dvw top-0 left-0 overflow-hidden">
        <Image
          src="/images/background.png"
          alt="background image"
          width={2000}
          height={1000}
          className="w-full brightness-30 animate-fade-in animate-duration-800 overflow-hidden"
          loading="lazy" />

        <div className="w-full h-20 bg-linear-to-b from-transparent to-background bottom-0 left-0 absolute" />
      </section>

      <section
        className="flex flex-col w-full items-center justify-center px-10">
        <p
          className="text-center text-6xl font-heading font-bold animate-blurred-fade-in">
          The app built for <br />
          your team <span className="text-accent"> workflow </span>
        </p>

        <Image
          src="/images/dashboard.webp"
          alt="Dashboard"
          className="animate-fade-in-up mt-10 rounded-lg border border-background-focus animate-duration-1000"
          width={1000}
          height={600}
        />
      </section>
    </MarketingLayout>
  )
}
