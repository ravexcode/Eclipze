import { requireAuthenticatedUser } from "@/lib/auth";

export default async function ProfileSettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAuthenticatedUser();
  return children;
}
