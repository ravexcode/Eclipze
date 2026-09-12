import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getWorkspaceSnapshot(user.id));
}
