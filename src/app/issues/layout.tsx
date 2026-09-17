import { requireAuthenticatedUser } from "@/lib/auth";

export default async function IssuesLayout({ children }: { children: React.ReactNode }) {
  await requireAuthenticatedUser();
  return children;
}
