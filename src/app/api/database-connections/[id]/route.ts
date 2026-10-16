import { getCurrentUser } from "@/lib/auth";
import { DATABASE_PROVIDER_LABELS } from "@/constants/database-connections";
import { databaseJson, findDatabaseConnection } from "@/lib/database-connections";
import { erdAccessError } from "@/lib/erd";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return databaseJson({ message: "Unauthorized" }, 401);
  }

  const accessError = erdAccessError(user);

  if (accessError) {
    return accessError;
  }

  const { id } = await context.params;
  const connection = await findDatabaseConnection(user.id, id);

  if (!connection) {
    return databaseJson({ message: "Database connection not found." }, 404);
  }

  await prisma.databaseConnection.delete({ where: { id: connection.id } });

  return databaseJson({
    message: `${DATABASE_PROVIDER_LABELS[connection.provider]} disconnected.`,
  });
}
