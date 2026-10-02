import Header from "@/components/ui/header";

type MarketingLayoutProps = {
  children?: React.ReactNode;
  hasToken?: boolean;
};

export default function MarketingLayout({ children, hasToken = false }: MarketingLayoutProps) {
  return (
    <div
      className="relative min-h-dvh w-full  text-foreground py-10">
      <Header hasToken={hasToken} />
      <main
        className="w-full min-w-0 z-2">
        {children}
      </main>
    </div>
  );
}
