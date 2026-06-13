import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardClient from "./DashboardClient";
import { Target, BarChart2, Trophy, Users, ChevronRight, Bot, Zap } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const username = user.user_metadata?.username || user.email?.split("@")[0] || "Predictor";

  const { count: predictionsCount } = await supabase
    .from("predictions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const daysToKickoff = getDaysToKickoff();
  const daysToFinal  = getDaysToFinal();
  const hasStarted   = daysToKickoff === 0;

  const stats = [
    { label: "My Predictions",  value: predictionsCount || 0, icon: Target,   accent: "#f5c518", bg: "rgba(245,197,24,0.07)"  },
    { label: "Groups",          value: 12,                    icon: BarChart2, accent: "#60a5fa", bg: "rgba(96,165,250,0.07)"  },
    { label: "Teams",           value: 48,                    icon: Users,     accent: "#34d399", bg: "rgba(52,211,153,0.07)"  },
    { label: "Days to Final",   value: daysToFinal,           icon: Trophy,    accent: "#c084fc", bg: "rgba(192,132,252,0.07)" },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#080b14]">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden border-b border-[#1e2640]">
        {/* grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(232,234,240,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232,234,240,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* top gold glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[640px] h-[260px] bg-[#f5c518] opacity-[0.07] blur-[80px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-8">

            {/* Left: greeting */}
            <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5c51812] border border-[#f5c51828] text-[#f5c518] text-[10px] sm:text-xs font-semibold mb-4 sm:mb-5 max-w-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f5c518] animate-pulse" />
                FIFA World Cup 2026 · USA &amp; Canada &amp; Mexico
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-[#e8eaf0] leading-tight mb-2">
                Welcome back,{" "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(90deg, #f5c518, #fbbf24)" }}
                >
                  {username}
                </span>
              </h1>
              <p className="text-[#8899bb] text-xs sm:text-base">
                {hasStarted ? (
                  <>
                    The World Cup is{" "}
                    <span className="text-[#e8eaf0] font-semibold">underway</span>.
                    {" "}Make your AI-powered predictions now.
                  </>
                ) : (
                  <>
                    The Group Stage kicks off in{" "}
                    <span className="text-[#e8eaf0] font-semibold">{daysToKickoff} day{daysToKickoff !== 1 ? "s" : ""}</span>.
                    {" "}Make your AI-powered predictions now.
                  </>
                )}
              </p>
            </div>

            {/* Right: countdown badge */}
            <div className="flex gap-3 justify-center sm:justify-end w-full sm:w-auto shrink-0">
              {hasStarted ? (
                <LiveBadge />
              ) : (
                <CountdownBadge label="Kickoff" value={daysToKickoff} accent="#f5c518" />
              )}
              <CountdownBadge label="Final" value={daysToFinal} accent="#c084fc" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon, accent, bg }) => (
            <div
              key={label}
              className="p-4 sm:p-5 rounded-2xl border border-[#1e2640] hover:border-[#2d3a5a] transition-all duration-200 animate-fade-in"
              style={{ background: bg }}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className="w-4 h-4" style={{ color: accent }} />
                <div className="w-1.5 h-1.5 rounded-full opacity-60" style={{ background: accent }} />
              </div>
              <div className="text-2xl sm:text-3xl font-black" style={{ color: accent }}>{value}</div>
              <div className="text-xs text-[#8899bb] mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/groups"
            className="group relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[#0e1220] border border-[#1e2640] hover:border-[#f5c51840] transition-all duration-300 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#f5c51808] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#f5c51812] border border-[#f5c51820] flex items-center justify-center shrink-0">
                <BarChart2 className="w-5 h-5 text-[#f5c518]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-[#e8eaf0] group-hover:text-[#f5c518] transition-colors mb-1">
                  Group Stage
                </h3>
                <p className="text-xs sm:text-sm text-[#8899bb]">
                  12 groups · 48 teams · Predict every match
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#4a5570] group-hover:text-[#f5c518] group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
            </div>
          </Link>

          <Link
            href="/bracket"
            className="group relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[#0e1220] border border-[#1e2640] hover:border-[#34d39940] transition-all duration-300 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#34d39908] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="relative flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#34d39912] border border-[#34d39920] flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-[#34d399]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-[#e8eaf0] group-hover:text-[#34d399] transition-colors mb-1">
                  Tournament Bracket
                </h3>
                <p className="text-xs sm:text-sm text-[#8899bb]">
                  R32 → Final · AI auto-fill bracket
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#4a5570] group-hover:text-[#34d399] group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
            </div>
          </Link>
        </div>

        {/* AI highlight */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-[#f5c51820] bg-[#0e1220]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#f5c51808] via-transparent to-transparent pointer-events-none" />
          {/* Stacked on mobile (button full-width below), inline from sm up */}
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#f5c51815] flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-[#f5c518]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#e8eaf0]">
                  AI-powered predictions
                </p>
                <p className="text-xs text-[#8899bb] mt-0.5 leading-relaxed">
                  Instant match analysis — scoreline, winner, confidence &amp; reasoning
                </p>
              </div>
            </div>
            <Link
              href="/groups"
              className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-[#f5c518] text-[#080b14] text-xs font-bold hover:bg-[#fcd34d] transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Zap className="w-3 h-3" />
              Try now
            </Link>
          </div>
        </div>

        {/* Upcoming fixtures */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#0e1220] border border-[#1e2640]">
          <DashboardClient />
        </div>
      </div>
    </div>
  );
}

function CountdownBadge({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="flex flex-col items-center px-5 py-4 rounded-2xl border"
      style={{ borderColor: `${accent}20`, background: `${accent}08` }}
    >
      <span className="text-3xl font-black" style={{ color: accent }}>{value}</span>
      <span className="text-[10px] font-semibold text-[#8899bb] mt-0.5 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function LiveBadge() {
  return (
    <div
      className="flex flex-col items-center justify-center px-5 py-4 rounded-2xl border"
      style={{ borderColor: "#f5c51820", background: "#f5c51808" }}
    >
      <span className="flex items-center gap-1.5 text-xl font-black text-[#f5c518]">
        <span className="w-2 h-2 rounded-full bg-[#f5c518] animate-pulse" />
        Live
      </span>
      <span className="text-[10px] font-semibold text-[#8899bb] mt-0.5 uppercase tracking-wider">
        World Cup
      </span>
    </div>
  );
}

function getDaysToKickoff(): number {
  const kickoff = new Date("2026-06-11");
  const now = new Date();
  return Math.max(0, Math.ceil((kickoff.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function getDaysToFinal(): number {
  const final = new Date("2026-07-19");
  const now = new Date();
  return Math.max(0, Math.ceil((final.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}
