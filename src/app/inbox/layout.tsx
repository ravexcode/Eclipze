import { requireAuthenticatedUser } from "@/lib/auth";

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  await requireAuthenticatedUser();
  return children;
}
