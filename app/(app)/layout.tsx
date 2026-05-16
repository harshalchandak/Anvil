import type { ReactNode } from "react";
import { requireAppUser } from "@/lib/auth";
import { Sidebar } from "@/components/app/Sidebar";
import { Topbar } from "@/components/app/Topbar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { appUser } = await requireAppUser();
  const user = { email: appUser.email, displayName: appUser.displayName };

  return (
    <div className="flex min-h-screen w-full bg-[var(--background)]">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 px-6 py-8 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
