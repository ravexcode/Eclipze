import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getWorkspaceSnapshot } from "@/lib/workspace";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  return NextResponse.json(await getWorkspaceSnapshot(user), {
    headers: PRIVATE_NO_STORE_HEADERS,
  });
}
