import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { badRequest, parseBody, requiredString } from "@/lib/workspace-api";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const skills = await prisma.userSkill.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
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

  return NextResponse.json({ skills }, { headers: PRIVATE_NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");

  const name = requiredString(body.name, "name");
  const description = requiredString(body.description, "description");
  const content = requiredString(body.content, "content");

  if (name.error) return name.error;
  if (description.error) return description.error;
  if (content.error) return content.error;
  if (name.value.length > 100) return badRequest("Skill name is too long.");
  if (description.value.length > 500) return badRequest("Skill description is too long.");
  if (content.value.length > 40_000) return badRequest("Skill instructions are too long.");

  const skill = await prisma.userSkill.create({
    data: {
      userId: user.id,
      source: "CUSTOM",
      slug: name.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "custom-skill",
      name: name.value,
      description: description.value,
      content: content.value,
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

  return NextResponse.json({ skill }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS });
}
