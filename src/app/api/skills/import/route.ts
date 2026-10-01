import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { requestSkillsSh } from "@/lib/skills-sh";
import prisma from "@/lib/prisma";
import { badRequest, parseBody, requiredString } from "@/lib/workspace-api";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");

  const sourceId = requiredString(body.sourceId, "sourceId");
  const name = requiredString(body.name, "name");
  const description = requiredString(body.description, "description");
  if (sourceId.error) return sourceId.error;
  if (name.error) return name.error;
  if (description.error) return description.error;

  const segments = sourceId.value.split("/");
  if (segments.length < 2 || segments.length > 4 || segments.some(part => !/^[A-Za-z0-9._-]+$/.test(part))) {
    return badRequest("sourceId is invalid.");
  }

  const result = await requestSkillsSh(`/skills/${segments.map(encodeURIComponent).join("/")}`);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const payload = result.data as {
    id?: unknown;
    source?: unknown;
    slug?: unknown;
    hash?: unknown;
    files?: Array<{ path?: unknown; contents?: unknown }>;
  };
  const skillFile = payload.files?.find(file => file.path === "SKILL.md");

  if (
    payload.id !== sourceId.value ||
    typeof payload.source !== "string" ||
    typeof payload.slug !== "string" ||
    typeof skillFile?.contents !== "string"
  ) {
    return NextResponse.json({ message: "The selected skill does not contain a usable SKILL.md." }, { status: 422, headers: PRIVATE_NO_STORE_HEADERS });
  }
  if (skillFile.contents.length > 40_000) return badRequest("Skill instructions are too large to import.");

  const skill = await prisma.userSkill.upsert({
    where: { userId_sourceId: { userId: user.id, sourceId: sourceId.value } },
    create: {
      userId: user.id,
      sourceId: sourceId.value,
      source: payload.source,
      slug: payload.slug,
      name: name.value.slice(0, 100),
      description: description.value.slice(0, 500),
      content: skillFile.contents,
      version: typeof payload.hash === "string" ? payload.hash : "1",
    },
    update: {
      name: name.value.slice(0, 100),
      description: description.value.slice(0, 500),
      content: skillFile.contents,
      version: typeof payload.hash === "string" ? payload.hash : "1",
    },
    select: {
      id: true,
      sourceId: true,
      source: true,
      slug: true,
      name: true,
      description: true,
      content: true,
      version: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ skill }, { status: 200, headers: PRIVATE_NO_STORE_HEADERS });
}
