import "server-only";

import {
  DATABASE_PROJECT_LIST_LIMIT,
  DATABASE_PROVIDER_LABELS,
  NEON_API_URL,
} from "@/constants/database-connections";
import { executePostgres, inspectPostgres } from "@/lib/database-providers/postgres";
import { requestProviderJson } from "@/lib/database-providers/http";
import type { DatabaseCredential, DatabaseProviderClient } from "@/lib/database-providers/types";
import type { DatabaseProject } from "@/types/database-connections";

const LABEL = DATABASE_PROVIDER_LABELS.NEON;

type NeonProject = { id: string; name: string; region_id?: string };
type NeonBranch = { id: string; default?: boolean };
type NeonDatabase = { name: string; owner_name: string };

function toProjects(projects: NeonProject[] | undefined): DatabaseProject[] {
  return (projects ?? []).map(project => ({
    id: project.id,
    name: project.name,
    detail: project.region_id ?? null,
  }));
}

async function listOrganizationProjects(token: string) {
  const { organizations } = await requestProviderJson<{ organizations?: Array<{ id: string }> }>({
    label: LABEL,
    url: `${NEON_API_URL}/users/me/organizations`,
    token,
  });
  const projectLists = await Promise.all((organizations ?? []).map(organization => (
    requestProviderJson<{ projects?: NeonProject[] }>({
      label: LABEL,
      url: `${NEON_API_URL}/projects?limit=${DATABASE_PROJECT_LIST_LIMIT}&org_id=${encodeURIComponent(organization.id)}`,
      token,
    })
  )));

  return projectLists.flatMap(list => toProjects(list.projects));
}

// Resolves the default branch's first database to a direct Postgres connection string.
async function getConnectionString(credential: DatabaseCredential, projectId: string) {
  const projectPath = `${NEON_API_URL}/projects/${encodeURIComponent(projectId)}`;
  const { branches } = await requestProviderJson<{ branches?: NeonBranch[] }>({
    label: LABEL,
    url: `${projectPath}/branches`,
    token: credential.secret,
  });
  const branch = branches?.find(item => item.default) ?? branches?.[0];

  if (!branch) throw new Error("This Neon project has no branches.");

  const { databases } = await requestProviderJson<{ databases?: NeonDatabase[] }>({
    label: LABEL,
    url: `${projectPath}/branches/${encodeURIComponent(branch.id)}/databases`,
    token: credential.secret,
  });
  const database = databases?.[0];

  if (!database) throw new Error("This Neon project has no databases on its default branch.");

  const searchParams = new URLSearchParams({
    branch_id: branch.id,
    database_name: database.name,
    role_name: database.owner_name,
  });
  const { uri } = await requestProviderJson<{ uri?: string }>({
    label: LABEL,
    url: `${projectPath}/connection_uri?${searchParams.toString()}`,
    token: credential.secret,
  });

  if (!uri) throw new Error("Neon did not return a connection string.");

  return uri;
}

export const neonProvider: DatabaseProviderClient = {
  async validate(credential) {
    await this.listProjects(credential);
  },

  async listProjects(credential) {
    try {
      const { projects } = await requestProviderJson<{ projects?: NeonProject[] }>({
        label: LABEL,
        url: `${NEON_API_URL}/projects?limit=${DATABASE_PROJECT_LIST_LIMIT}`,
        token: credential.secret,
      });

      return toProjects(projects);
    } catch (error) {
      // Personal keys must name an organization; fall back to listing each organization's projects.
      const projects = await listOrganizationProjects(credential.secret).catch(() => null);

      if (!projects) throw error;

      return projects;
    }
  },

  async inspect(credential, projectId) {
    return inspectPostgres(await getConnectionString(credential, projectId), LABEL);
  },

  async execute(credential, projectId, statements) {
    return executePostgres(await getConnectionString(credential, projectId), LABEL, statements);
  },
};
