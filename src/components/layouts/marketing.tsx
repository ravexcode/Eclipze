import Header from "@/components/ui/header";

type MarketingLayoutProps = {
  children?: React.ReactNode;
  hasToken?: boolean;
};

export default function MarketingLayout({ children, hasToken = false }: MarketingLayoutProps) {
  return (
    <div
      className="relative grid min-h-dvh w-full grid-rows-[auto_1fr_auto] items-center justify-center bg-background text-foreground">
      <Header hasToken={hasToken} />
      <main
        className="w-full min-w-0">
        {children}
      </main>
    </div>
  );
}
