import { requireAuthenticatedUser } from "@/lib/auth";

export default async function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthenticatedUser();

  return children;
}
