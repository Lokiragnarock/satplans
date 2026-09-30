import { Nav } from "@/components/Nav";
import { requireMember } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireMember();
  return (
    <>
      <Nav name={me.display_name} />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">{children}</main>
    </>
  );
}
