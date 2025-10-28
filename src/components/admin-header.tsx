"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

const getPageName = (url: string) => {
  if (url === "/admin/authors") return "Authors";
  if (url === "/admin/genres") return "Genres";
  if (url === "/admin/books") return "Books";
  if (url === "/admin/books/new") return "Generate Book";
  if (url === "/admin/personalities") return "Personalities";
  if (url === "/admin/writing-styles") return "Writing Styles";
  if (url === "/admin/open-router") return "Open Router Costs";
  if (url === "/admin/users") return "Users";
  return "";
};

export default function AdminHeader() {
  const pathName = usePathname();
  const pageName = getPageName(pathName);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4 flex-1">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            {pageName !== "" ? (
              <>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageName}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}