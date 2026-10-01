import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { requestSkillsSh } from "@/lib/skills-sh";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ message: "Search with at least two characters." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const result = await requestSkillsSh(`/skills/search?q=${encodeURIComponent(query)}&limit=20`);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const payload = result.data as {
    data?: Array<Record<string, unknown>>;
    searchType?: string;
  };
  const skills = (payload.data ?? []).flatMap(skill => {
    if (
      typeof skill.id !== "string" ||
      typeof skill.name !== "string" ||
      typeof skill.source !== "string" ||
      typeof skill.slug !== "string"
    ) {
      return [];
    }

    return [{
      id: skill.id,
      name: skill.name,
      source: skill.source,
      slug: skill.slug,
      installs: typeof skill.installs === "number" ? skill.installs : 0,
      description: typeof skill.description === "string" ? skill.description : "",
      url: typeof skill.url === "string" ? skill.url : null,
      isDuplicate: skill.isDuplicate === true,
    }];
  });

  return NextResponse.json({ skills, searchType: payload.searchType ?? "" }, { headers: PRIVATE_NO_STORE_HEADERS });
}
