import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMessage } from "@/lib/gmail";
import { reviewImportance } from "@/lib/mail-review";
import { isAiProvider } from "@/types/ai";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 }); const input = await request.json().catch(() => null) as { provider?: unknown } | null; if (!isAiProvider(input?.provider)) return NextResponse.json({ message: "A valid provider is required." }, { status: 400 }); try { const id = (await params).id; const message = await getMessage(user.id, id); const result = await reviewImportance(user.id, id, input.provider, message.subject, message.sender, message.body); return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } }); } catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to review message." }, { status: 502 }); } }
