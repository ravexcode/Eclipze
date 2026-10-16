import type { DatabaseProject, DatabaseProvider, DatabaseSchema } from "@/types/database-connections";

export type DatabaseCredential = {
  provider: DatabaseProvider;
  secret: string;
  baseUrl: string | null;
};

export type DatabaseProviderClient = {
  // Throws a user-facing error when the provider rejects the credential.
  validate(credential: DatabaseCredential): Promise<void>;
  listProjects(credential: DatabaseCredential): Promise<DatabaseProject[]>;
  inspect(credential: DatabaseCredential, projectId: string): Promise<DatabaseSchema>;
  execute(credential: DatabaseCredential, projectId: string, statements: string[]): Promise<string>;
};
