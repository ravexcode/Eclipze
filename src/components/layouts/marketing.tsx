import Header from "@/components/ui/header";

type MarketingLayoutProps = {
  children?: React.ReactNode;
  hasToken?: boolean;
};

export default function MarketingLayout({ children, hasToken = false }: MarketingLayoutProps) {
  return (
    <div
      className="w-full min-h-dvh grid grid-rows-[auto_1fr_auto] items-center justify-center z-2 relative">
      <Header hasToken={hasToken} />
      <main
        className="min-w-dvw">
        {children}
      </main>
    </div>
  );
}
