import { requireAuthenticatedUser } from "@/lib/auth";

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthenticatedUser();

  return children;
}
