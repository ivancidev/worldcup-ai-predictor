import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BracketClient from "./BracketClient";

export default async function BracketPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-full">
        <div className="max-w-7xl mx-auto mb-8">
          <h1 className="text-3xl font-black text-[#e8eaf0] mb-2">
            Tournament Bracket
          </h1>
          <p className="text-[#8899bb]">
            Round of 32 → Round of 16 → Quarterfinals → Semifinals → Final
          </p>
        </div>
        <BracketClient userId={user.id} />
      </div>
    </div>
  );
}
