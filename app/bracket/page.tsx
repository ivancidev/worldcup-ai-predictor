import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BracketClient from "./BracketClient";
import { getServerLocale } from "@/lib/i18n/server";
import { getTranslation } from "@/lib/i18n/utils";

export default async function BracketPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const locale = await getServerLocale();

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-full">
        <div className="max-w-7xl mx-auto mb-8">
          <h1 className="text-3xl font-black text-[#e8eaf0] mb-2">
            {getTranslation(locale, "bracket.title")}
          </h1>
          <p className="text-[#8899bb]">
            {getTranslation(locale, "bracket.subtitle")}
          </p>
        </div>
        <BracketClient />
      </div>
    </div>
  );
}
