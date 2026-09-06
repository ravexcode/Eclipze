import { requireAuthenticatedUser } from "@/lib/auth";

export default async function MailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthenticatedUser();

  return children;
}
