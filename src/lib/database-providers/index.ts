import "server-only";

import { insforgeProvider } from "@/lib/database-providers/insforge";
import { mongodbProvider } from "@/lib/database-providers/mongodb";
import { neonProvider } from "@/lib/database-providers/neon";
import { prismaPostgresProvider } from "@/lib/database-providers/prisma-postgres";
import { supabaseProvider } from "@/lib/database-providers/supabase";
import type { DatabaseProviderClient } from "@/lib/database-providers/types";
import type { DatabaseProvider } from "@/types/database-connections";

export const DATABASE_PROVIDER_CLIENTS: Record<DatabaseProvider, DatabaseProviderClient> = {
  SUPABASE: supabaseProvider,
  PRISMA: prismaPostgresProvider,
  MONGODB: mongodbProvider,
  NEON: neonProvider,
  INSFORGE: insforgeProvider,
};
