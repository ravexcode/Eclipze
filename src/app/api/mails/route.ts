import { NextResponse } from "next/server";

import { getCurrentUser, normalizeEmail } from "@/lib/auth";
import { badRequest, parseBody, requiredString } from "@/lib/workspace-api";
import prisma from "@/lib/prisma";

const PRIVATE_NO_STORE_HEADERS = { "Cache-Control": "private, no-store, max-age=0" };
const USER_SUMMARY = { id: true, username: true, email: true } as const;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const folder = new URL(request.url).searchParams.get("folder") ?? "inbox";
  if (folder !== "inbox" && folder !== "sent") return badRequest("folder must be inbox or sent.");

  const mails = await prisma.mail.findMany({
    where: folder === "inbox" ? { recipientId: user.id } : { senderId: user.id },
    orderBy: { sentAt: "desc" },
    take: 50,
    include: {
      sender: { select: USER_SUMMARY },
      recipient: { select: USER_SUMMARY },
    },
  });

  return NextResponse.json({ mails }, { headers: PRIVATE_NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");

  const recipientAddress = requiredString(body.to, "to");
  if (recipientAddress.error) return recipientAddress.error;
  const subject = requiredString(body.subject, "subject");
  if (subject.error) return subject.error;
  const mailBody = requiredString(body.body, "body");
  if (mailBody.error) return mailBody.error;

  if (recipientAddress.value.length > 255) return badRequest("Recipient must be 255 characters or fewer.");
  if (subject.value.length > 200) return badRequest("Subject must be 200 characters or fewer.");
  if (mailBody.value.length > 20000) return badRequest("Message must be 20,000 characters or fewer.");

  const recipientLookup = recipientAddress.value.includes("@")
    ? { email: normalizeEmail(recipientAddress.value) }
    : { username: recipientAddress.value };
  const recipient = await prisma.user.findFirst({
    where: {
      ...recipientLookup,
      id: { not: user.id },
      emailVerifiedAt: { not: null },
    },
    select: USER_SUMMARY,
  });

  if (!recipient) return badRequest("No verified user was found for that email or username.");

  const mail = await prisma.mail.create({
    data: {
      senderId: user.id,
      recipientId: recipient.id,
      subject: subject.value,
      body: mailBody.value,
    },
    include: {
      sender: { select: USER_SUMMARY },
      recipient: { select: USER_SUMMARY },
    },
  });

  return NextResponse.json({ mail }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS });
}
