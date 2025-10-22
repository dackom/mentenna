"use client";

import * as React from "react";
import Image from "next/image";
import {
  BookOpen,
  Tags,
  Brain,
  PenTool,
  UserPenIcon,
  UsersRound,
  DollarSign,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavGlobal } from "@/components/nav-global";
import { NavUser } from "@/components/nav-user";
import { NavConfiguration } from "@/components/nav-configuration";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Authors",
      url: "/admin/authors",
      icon: UserPenIcon,
    },
    {
      title: "Books",
      url: "/admin/books",
      icon: BookOpen,
    },
  ],
  navConfiguration: [
    {
      title: "Genres",
      url: "/admin/genres",
      icon: Tags,
    },
    {
      title: "Personalities",
      url: "/admin/personalities",
      icon: Brain,
    },
    {
      title: "Writing Styles",
      url: "/admin/writing-styles",
      icon: PenTool,
    },
  ],
  navGlobal: [
    {
      title: "Open Router Costs",
      url: "/admin/open-router",
      icon: DollarSign,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: UsersRound,
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
  };
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Image
          src="/mentenna-logo.svg"
          alt="Mentenna Logo"
          width={150}
          height={40}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavConfiguration items={data.navConfiguration} />
        <NavGlobal items={data.navGlobal} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
