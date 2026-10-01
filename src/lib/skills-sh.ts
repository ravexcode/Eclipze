import "server-only";

import { getVercelOidcToken } from "@vercel/oidc";

const SKILLS_SH_API = "https://skills.sh/api/v1";

export async function requestSkillsSh(path: string) {
  let token: string;

  try {
    token = await getVercelOidcToken();
  } catch {
    return {
      ok: false as const,
      status: 503,
      message: "Skill search requires Vercel OIDC. Enable OIDC for this project and link the local Vercel project for development.",
    };
  }

  try {
    const response = await fetch(`${SKILLS_SH_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return {
        ok: false as const,
        status: response.status === 401 || response.status === 403 ? 503 : 502,
        message: response.status === 401 || response.status === 403
          ? "Skills.sh did not accept this project's OIDC identity. Check the Vercel OIDC configuration."
          : "Skills.sh is temporarily unavailable.",
      };
    }

    return { ok: true as const, data: await response.json() as unknown };
  } catch {
    return {
      ok: false as const,
      status: 503,
      message: "Unable to reach Skills.sh right now.",
    };
  }
}
