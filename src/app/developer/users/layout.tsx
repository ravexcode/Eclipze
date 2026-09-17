import { requireAuthenticatedUser } from "@/lib/auth";

export default async function DeveloperUsersLayout({ children }: { children: React.ReactNode }) {
  await requireAuthenticatedUser();
  return children;
}
