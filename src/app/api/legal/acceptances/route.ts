import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getLegalAcceptances } from "@/lib/legal-acceptance";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const acceptances = await getLegalAcceptances(user.id);

  return NextResponse.json(
    { acceptances },
    { headers: PRIVATE_NO_STORE_HEADERS },
  );
}
