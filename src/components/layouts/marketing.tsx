import Header from "@/components/ui/header";

export default function MarketingLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="w-full min-h-dvh grid grid-rows-[auto_1fr_auto] items-center justify-center z-2 relative">
      <Header />
      <main
        className="min-w-dvw">
        {children}
      </main>
    </div>
  );
}
