"use client";

import DashLayout from "@/components/layouts/dash";
import Heading from "@/components/ui/heading";

import { useRouter } from "next/navigation";

export default function MailsPage() {
  const router = useRouter();

  return (
    <DashLayout current="mails" router={router}>
      <main className="w-full">
        <Heading label="My mails" />
      </main>
    </DashLayout>
  );
}
