import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppHeader } from "./AppHeader";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/notes");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
