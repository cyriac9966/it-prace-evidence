import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <NavBar
        user={{ name: user.name, email: user.email, role: user.role }}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
