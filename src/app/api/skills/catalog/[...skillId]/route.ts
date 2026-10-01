import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { requestSkillsSh } from "@/lib/skills-sh";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

type RouteContext = { params: Promise<{ skillId: string[] }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const { skillId } = await context.params;
  if (
    skillId.length < 2 ||
    skillId.length > 4 ||
    skillId.some(part => !/^[A-Za-z0-9._-]+$/.test(part))
  ) {
    return NextResponse.json({ message: "Invalid skill ID." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const encodedId = skillId.map(encodeURIComponent).join("/");
  const result = await requestSkillsSh(`/skills/${encodedId}`);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const payload = result.data as {
    id?: unknown;
    source?: unknown;
    slug?: unknown;
    installs?: unknown;
    hash?: unknown;
    files?: Array<{ path?: unknown; contents?: unknown }>;
  };
  const skillFile = payload.files?.find(file => file.path === "SKILL.md");

  if (
    payload.id !== skillId.join("/") ||
    typeof payload.source !== "string" ||
    typeof payload.slug !== "string" ||
    typeof skillFile?.contents !== "string"
  ) {
    return NextResponse.json({ message: "This result does not contain a usable SKILL.md file." }, { status: 422, headers: PRIVATE_NO_STORE_HEADERS });
  }

  if (skillFile.contents.length > 40_000) {
    return NextResponse.json({ message: "This skill is too large to import." }, { status: 413, headers: PRIVATE_NO_STORE_HEADERS });
  }

  return NextResponse.json({
    id: payload.id,
    source: payload.source,
    slug: payload.slug,
    installs: typeof payload.installs === "number" ? payload.installs : 0,
    version: typeof payload.hash === "string" ? payload.hash : "1",
    content: skillFile.contents,
  }, { headers: PRIVATE_NO_STORE_HEADERS });
}
