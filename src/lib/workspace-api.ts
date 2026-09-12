import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export function notFound(message = "Resource not found.") {
  return NextResponse.json({ message }, { status: 404 });
}

export function parseBody(request: Request) {
  return request.json().catch(() => null) as Promise<Record<string, unknown> | null>;
}

export function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    return { error: badRequest(`${field} is required.`) };
  }

  return { value: value.trim() };
}

export function optionalString(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: badRequest(`${field} must be a string.`) };
  }

  return { value: value.trim() || null };
}

export function enumString<T extends string>(value: unknown, values: readonly T[], field: string, fallback?: T) {
  if (value === undefined && fallback) {
    return { value: fallback };
  }

  if (typeof value !== "string" || !values.includes(value as T)) {
    return { error: badRequest(`${field} is invalid.`) };
  }

  return { value: value as T };
}

export async function ownedProject(userId: string, projectId: string | null | undefined) {
  if (!projectId) {
    return null;
  }

  return prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
}

export async function ownedAgent(userId: string, agentId: string) {
  return prisma.agent.findFirst({ where: { id: agentId, userId }, select: { id: true } });
}
