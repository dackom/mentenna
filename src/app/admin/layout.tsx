import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { ModeToggle } from "@/components/theme-toggle";
import AdminHeader from "@/components/admin-header";
export default async function AuthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((h) => h.headers()),
  });

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: session?.user?.name || "User",
          email: session?.user?.email || "",
        }}
      />
      <SidebarInset className="flex flex-col h-screen">
        <div className="absolute top-4 right-4 z-10">
          <ModeToggle />
        </div>
        <div className="flex-1 flex flex-col min-h-0 relative px-4">
          <div className="flex flex-col h-full">
            <AdminHeader />
            <div className="flex-1 min-h-0">{children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
