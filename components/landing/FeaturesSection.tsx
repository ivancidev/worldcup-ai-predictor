import { Bot, BarChart2, Trophy, Share2, Zap, Smartphone } from "lucide-react";

const FEATURES = [
  {
    icon: Bot,
    title: "AI-Powered Predictions",
    description:
      "AI analyzes real stats including form, head-to-head records and goals scored to give you expert-level match predictions with detailed reasoning.",
    accent: "#f5c518",
  },
  {
    icon: BarChart2,
    title: "Real Live Data",
    description:
      "Fixtures, standings and team statistics always up to date with live World Cup 2026 results.",
    accent: "#3b82f6",
  },
  {
    icon: Trophy,
    title: "Full Bracket Builder",
    description:
      "Build your complete World Cup bracket from Round of 32 all the way to the Final. Let AI auto-fill it or set every score yourself.",
    accent: "#22c55e",
  },
  {
    icon: Share2,
    title: "Share Predictions",
    description:
      "Generate a shareable link for any prediction. Rich previews on X, WhatsApp, and more. Show the world your picks.",
    accent: "#a855f7",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Predictions load instantly thanks to smart caching. Get your full analysis in seconds.",
    accent: "#f59e0b",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description:
      "Perfectly responsive from phone to desktop. Track the tournament from anywhere, anytime.",
    accent: "#ec4899",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e2640] text-[#8899bb] text-sm mb-4">
            Everything you need
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-[#e8eaf0] mb-4">
            Built for football fans
          </h2>
          <p className="text-[#8899bb] text-lg max-w-2xl mx-auto">
            From AI match analysis to shareable brackets every feature a real fan needs for World Cup 2026.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="animate-fade-in-up group relative p-6 rounded-2xl bg-[#0e1220] border border-[#1e2640] hover:border-[#2d3a5a] transition-all duration-300 overflow-hidden"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 0% 0%, ${feature.accent}10, transparent 60%)` }}
                />
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative"
                  style={{ background: `${feature.accent}15`, border: `1px solid ${feature.accent}30` }}
                >
                  <Icon className="w-5 h-5 relative" style={{ color: feature.accent }} />
                </div>
                <h3 className="text-lg font-bold text-[#e8eaf0] mb-2 relative">{feature.title}</h3>
                <p className="text-[#8899bb] text-sm leading-relaxed relative">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
