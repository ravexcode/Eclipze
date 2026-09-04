import type { ReactNode } from "react";

import Sidebar from "@/components/sidebar";

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface Props {
  current: "overview" | "mails" | "issues" | "agents" | "projects";
  router: AppRouterInstance;
  children?: ReactNode;
}

const user = {
  name: "Ravexcode",
  avatar: "https://github.com/ravexcode.png",
  id: "",
};

export default function DashLayout(props: Props) {
  return (
    <div className="min-h-dvh w-full grid grid-cols-[auto_1fr] bg-background text-foreground">
      <Sidebar
        selected={props.current}
        user={user}
        router={props.router} />
      {props.children}
    </div>
  );
}
