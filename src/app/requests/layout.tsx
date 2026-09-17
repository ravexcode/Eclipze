import { requireAuthenticatedUser } from "@/lib/auth";

export default async function RequestsLayout({ children }: { children: React.ReactNode }) {
  await requireAuthenticatedUser();
  return children;
}
