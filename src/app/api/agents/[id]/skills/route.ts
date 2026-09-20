import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getWorkspaceSkill } from "@/lib/agent-skills";
import prisma from "@/lib/prisma";
import { badRequest, notFound, parseBody } from "@/lib/workspace-api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  void request;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const agent = await prisma.agent.findFirst({
    where: { id, userId: user.id },
    include: { skillSelections: { orderBy: { slug: "asc" } } },
  });

  if (!agent) {
    return notFound("Agent not found.");
  }

  return NextResponse.json({ skills: agent.skillSelections.map(selection => ({ slug: selection.slug, version: selection.version })) });
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const agent = await prisma.agent.findFirst({ where: { id, userId: user.id }, select: { id: true } });

  if (!agent) {
    return notFound("Agent not found.");
  }

  const body = await parseBody(request);
  const requestedSkills = body?.skills;

  if (!Array.isArray(requestedSkills) || requestedSkills.some(slug => typeof slug !== "string")) {
    return badRequest("skills must be an array of skill slugs.");
  }

  const uniqueSlugs = [...new Set(requestedSkills)];
  const skills = uniqueSlugs.map(slug => getWorkspaceSkill(slug));

  if (skills.some(skill => !skill)) {
    return badRequest("One or more skills are not available.");
  }

  await prisma.$transaction([
    prisma.agentSkillSelection.deleteMany({ where: { agentId: agent.id } }),
    prisma.agentSkillSelection.createMany({
      data: skills.filter((skill): skill is NonNullable<typeof skill> => Boolean(skill)).map(skill => ({
        agentId: agent.id,
        slug: skill.slug,
        version: skill.version,
      })),
    }),
  ]);

  return NextResponse.json({
    skills: skills.filter((skill): skill is NonNullable<typeof skill> => Boolean(skill)).map(skill => ({ slug: skill.slug, version: skill.version })),
  });
}
