import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={session.user.role} />
      <div className="flex-1 flex flex-col pb-16 lg:pb-0">
        <Header user={session.user} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
      <MobileNav userRole={session.user.role} />
    </div>
  );
}
