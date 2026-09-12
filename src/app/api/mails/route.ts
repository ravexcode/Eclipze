import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { badRequest, enumString, notFound, optionalString, ownedProject, parseBody, requiredString } from "@/lib/workspace-api";
import { serializeMail } from "@/lib/workspace";
import prisma from "@/lib/prisma";

const DIRECTIONS = ["INBOUND", "OUTBOUND"] as const;
const STATUSES = ["DRAFT", "SENT", "RECEIVED", "ARCHIVED"] as const;

function addresses(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.some(address => typeof address !== "string" || !address.trim())) {
    return badRequest("toAddresses must contain at least one address.");
  }
  return value.map(address => address.trim());
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const mails = await prisma.mail.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ mails: mails.map(serializeMail) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");
  const fromAddress = requiredString(body.fromAddress, "fromAddress");
  if (fromAddress.error) return fromAddress.error;
  const subject = requiredString(body.subject, "subject");
  if (subject.error) return subject.error;
  const mailBody = requiredString(body.body, "body");
  if (mailBody.error) return mailBody.error;
  const toAddresses = addresses(body.toAddresses);
  if (toAddresses instanceof NextResponse) return toAddresses;
  let projectId: string | null = null;
  if (body.projectId !== undefined) {
    const parsedProjectId = optionalString(body.projectId, "projectId");
    if (parsedProjectId.error) return parsedProjectId.error;
    projectId = parsedProjectId.value;
  }
  if (projectId && !(await ownedProject(user.id, projectId))) return notFound("Project not found.");
  const direction = enumString(body.direction, DIRECTIONS, "direction");
  if (direction.error) return direction.error;
  const status = enumString(body.status, STATUSES, "status", "DRAFT");
  if (status.error) return status.error;
  const mail = await prisma.mail.create({
    data: {
      userId: user.id,
      fromAddress: fromAddress.value,
      toAddresses,
      subject: subject.value,
      body: mailBody.value,
      projectId,
      direction: direction.value,
      status: status.value,
      sentAt: status.value === "SENT" ? new Date() : null,
      receivedAt: status.value === "RECEIVED" ? new Date() : null,
    },
  });
  return NextResponse.json({ mail: serializeMail(mail) }, { status: 201 });
}
