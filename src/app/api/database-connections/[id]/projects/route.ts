import { getCurrentUser } from "@/lib/auth";
import {
  databaseJson,
  findDatabaseConnection,
  readDatabaseCredential,
} from "@/lib/database-connections";
import { DATABASE_PROVIDER_CLIENTS } from "@/lib/database-providers";
import { erdAccessError } from "@/lib/erd";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
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

  try {
    const projects = await DATABASE_PROVIDER_CLIENTS[connection.provider].listProjects(
      readDatabaseCredential(connection),
    );

    return databaseJson({ projects });
  } catch (error) {
    return databaseJson({
      message: error instanceof Error ? error.message : "Unable to load projects.",
    }, 502);
  }
}
