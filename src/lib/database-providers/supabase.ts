import "server-only";

import {
  DATABASE_PROVIDER_LABELS,
  POSTGRES_INTROSPECTION_QUERY,
  SUPABASE_API_URL,
} from "@/constants/database-connections";
import type { DatabaseProviderClient } from "@/lib/database-providers/types";
import { requestProviderJson } from "@/lib/database-providers/http";
import { readPostgresSchema } from "@/utils/database-connections";

const LABEL = DATABASE_PROVIDER_LABELS.SUPABASE;

type SupabaseProject = {
  id?: string;
  ref?: string;
  name?: string;
  region?: string;
  status?: string;
};

function runQuery(token: string, projectRef: string, query: string) {
  return requestProviderJson<Array<Record<string, unknown>>>({
    label: LABEL,
    url: `${SUPABASE_API_URL}/projects/${encodeURIComponent(projectRef)}/database/query`,
    token,
    method: "POST",
    body: { query },
  });
}

export const supabaseProvider: DatabaseProviderClient = {
  async validate(credential) {
    await this.listProjects(credential);
  },

  async listProjects(credential) {
    const projects = await requestProviderJson<SupabaseProject[]>({
      label: LABEL,
      url: `${SUPABASE_API_URL}/projects`,
      token: credential.secret,
    });

    return (Array.isArray(projects) ? projects : []).flatMap(project => {
      const ref = project.ref ?? project.id;

      if (!ref) return [];

      return [{
        id: ref,
        name: project.name ?? ref,
        detail: [project.region, project.status].filter(Boolean).join(" · ") || null,
      }];
    });
  },

  async inspect(credential, projectId) {
    const rows = await runQuery(credential.secret, projectId, POSTGRES_INTROSPECTION_QUERY);

    return readPostgresSchema(rows?.[0]?.schema);
  },

  async execute(credential, projectId, statements) {
    // The query endpoint runs a multi-statement script; wrapping it keeps the changes atomic.
    const script = ["BEGIN;", ...statements.map(statement => statement.trim().replace(/;?$/, ";")), "COMMIT;"].join("\n");

    await runQuery(credential.secret, projectId, script);

    return `Applied ${statements.length} statement(s) in one transaction.`;
  },
};
