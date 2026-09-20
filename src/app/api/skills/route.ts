import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { listWorkspaceSkills } from "@/lib/agent-skills";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ skills: listWorkspaceSkills() }, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
