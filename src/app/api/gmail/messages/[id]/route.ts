import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMessage } from "@/lib/gmail";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 }); try { return NextResponse.json(await getMessage(user.id, (await params).id), { headers: { "Cache-Control": "private, no-store, max-age=0" } }); } catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to load message." }, { status: 502 }); } }
