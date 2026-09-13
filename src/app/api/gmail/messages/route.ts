import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listMessages } from "@/lib/gmail";
export async function GET(request: Request) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 }); try { const token = new URL(request.url).searchParams.get("pageToken") ?? undefined; return NextResponse.json(await listMessages(user.id, token), { headers: { "Cache-Control": "private, no-store, max-age=0" } }); } catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to load Gmail." }, { status: 502 }); } }
