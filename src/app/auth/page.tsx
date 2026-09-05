"use server";

import { redirect } from "next/navigation";

import { cookies } from "next/headers";

export default async function AuthRedirect() {
  const cookieStore = await cookies();

  const hasSession = !!cookieStore.get("token");

  if (hasSession) {
    redirect("/dashboard");
  }

  redirect("/auth/signin");
}
