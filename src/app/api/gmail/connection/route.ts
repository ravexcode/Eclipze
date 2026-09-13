import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getConnection } from "@/lib/gmail";
const headers = { "Cache-Control": "private, no-store, max-age=0" };
export async function GET() { const user = await getCurrentUser(); if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers }); return NextResponse.json(await getConnection(user.id), { headers }); }
