import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { badRequest, enumString, notFound, optionalString, ownedProject, parseBody, requiredString } from "@/lib/workspace-api";
import { serializeMail } from "@/lib/workspace";
import prisma from "@/lib/prisma";

const DIRECTIONS = ["INBOUND", "OUTBOUND"] as const;
const STATUSES = ["DRAFT", "SENT", "RECEIVED", "ARCHIVED"] as const;
type Context = { params: Promise<{ id: string }> };

async function findMail(userId: string, id: string) {
  return prisma.mail.findFirst({ where: { id, userId } });
}

function toAddresses(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.some(address => typeof address !== "string" || !address.trim())) {
    return { error: badRequest("toAddresses must contain at least one address.") };
  }
  return { value: value.map(address => (address as string).trim()) };
}

export async function GET(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const mail = await findMail(user.id, id);
  if (!mail) return notFound("Mail not found.");
  return NextResponse.json({ mail: { ...serializeMail(mail), body: mail.body } });
}

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!(await findMail(user.id, id))) return notFound("Mail not found.");
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");
  const data: { fromAddress?: string; toAddresses?: string[]; subject?: string; body?: string; projectId?: string | null; direction?: typeof DIRECTIONS[number]; status?: typeof STATUSES[number]; sentAt?: Date | null; receivedAt?: Date | null } = {};
  if (body.fromAddress !== undefined) {
    const value = requiredString(body.fromAddress, "fromAddress");
    if (value.error) return value.error;
    data.fromAddress = value.value;
  }
  if (body.toAddresses !== undefined) {
    const value = toAddresses(body.toAddresses);
    if (value.error) return value.error;
    data.toAddresses = value.value;
  }
  if (body.subject !== undefined) {
    const value = requiredString(body.subject, "subject");
    if (value.error) return value.error;
    data.subject = value.value;
  }
  if (body.body !== undefined) {
    const value = requiredString(body.body, "body");
    if (value.error) return value.error;
    data.body = value.value;
  }
  if (body.projectId !== undefined) {
    const value = optionalString(body.projectId, "projectId");
    if (value.error) return value.error;
    if (value.value && !(await ownedProject(user.id, value.value))) return notFound("Project not found.");
    data.projectId = value.value;
  }
  if (body.direction !== undefined) {
    const value = enumString(body.direction, DIRECTIONS, "direction");
    if (value.error) return value.error;
    data.direction = value.value;
  }
  if (body.status !== undefined) {
    const value = enumString(body.status, STATUSES, "status");
    if (value.error) return value.error;
    data.status = value.value;
    data.sentAt = value.value === "SENT" ? new Date() : null;
    data.receivedAt = value.value === "RECEIVED" ? new Date() : null;
  }
  const mail = await prisma.mail.update({ where: { id }, data });
  return NextResponse.json({ mail: serializeMail(mail) });
}

export async function DELETE(_request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!(await findMail(user.id, id))) return notFound("Mail not found.");
  await prisma.mail.delete({ where: { id } });
  return NextResponse.json({ message: "Mail deleted." });
}
