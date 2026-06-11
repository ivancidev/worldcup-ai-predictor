import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GroupsClient from "./GroupsClient";

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: userPredictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id);

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#e8eaf0] mb-2">
            Group Stage
          </h1>
          <p className="text-[#8899bb]">
            12 groups · 48 teams · Predict every match or let AI decide
          </p>
        </div>
        <GroupsClient
          userId={user.id}
          savedPredictions={userPredictions || []}
        />
      </div>
    </div>
  );
}
