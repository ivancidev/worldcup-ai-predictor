"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { Users, Trophy, Menu, X, LogOut, LayoutDashboard, Globe } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; user_metadata?: { username?: string } } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, locale, setLocale } = useTranslation();

  const NAV_LINKS = [
    { href: "/dashboard", label: t("navbar.dashboard"),   icon: LayoutDashboard },
    { href: "/groups",    label: t("navbar.groupStage"), icon: Users },
    { href: "/bracket",   label: t("navbar.bracket"),     icon: Trophy },
  ];

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const isPublicPage = pathname === "/" || pathname === "/auth";

  const renderLanguageSelector = () => (
    <button
      onClick={() => setLocale(locale === "en" ? "es" : "en")}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#141928] border border-[#1e2640] text-[#f5c518] hover:border-[#f5c51840] hover:bg-[#1e2640] transition-all cursor-pointer uppercase shrink-0"
      title={locale === "en" ? "Cambiar a Español" : "Switch to English"}
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{locale}</span>
    </button>
  );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        scrolled || !isPublicPage
          ? "glass border-b border-[#1e2640] shadow-lg shadow-black/20"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f5c518] to-[#c9a000] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Trophy className="w-4 h-4 text-[#080b14]" strokeWidth={2.5} />
          </div>
          <span className="font-black text-lg text-[#e8eaf0] hidden sm:block">
            WC<span className="text-[#f5c518]">2026</span>
          </span>
        </Link>
 
        {/* Desktop Nav — authenticated only */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                  pathname === href
                    ? "bg-[#f5c51820] text-[#f5c518]"
                    : "text-[#8899bb] hover:text-[#e8eaf0] hover:bg-[#1e2640]"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        )}
 
        {/* Auth — desktop */}
        <div className="hidden md:flex items-center gap-3">
          {renderLanguageSelector()}
          {user ? (
            <>
              <span className="text-sm text-[#8899bb] max-w-[120px] truncate">
                {user.user_metadata?.username || user.email?.split("@")[0]}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#8899bb] hover:text-[#e8eaf0] hover:bg-[#1e2640] rounded-lg transition-all duration-200 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t("navbar.signOut")}
              </button>
            </>
          ) : (
            <>
              <Link href="/auth" className="px-4 py-2 text-sm font-medium text-[#8899bb] hover:text-[#e8eaf0] transition-colors cursor-pointer">
                {t("navbar.signIn")}
              </Link>
              <Link
                href="/auth"
                className="px-4 py-2 text-sm font-semibold bg-[#f5c518] text-[#080b14] rounded-xl hover:bg-[#ffd54f] transition-all duration-200 active:scale-95 cursor-pointer"
              >
                {t("navbar.getStarted")}
              </Link>
            </>
          )}
        </div>
 
        {/* Mobile buttons */}
        <div className="md:hidden flex items-center gap-2">
          {renderLanguageSelector()}
          <button
            className="p-2 text-[#8899bb] hover:text-[#e8eaf0] hover:bg-[#1e2640] rounded-lg transition-all cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass border-b border-[#1e2640] px-4 py-4 space-y-1">
          {user && NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
                pathname === href
                  ? "bg-[#f5c51820] text-[#f5c518]"
                  : "text-[#8899bb] hover:text-[#e8eaf0] hover:bg-[#1e2640]"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <div className={cn("pt-2 border-t border-[#1e2640]", user && "mt-2")}>
            {user ? (
              <button
                onClick={() => { handleSignOut(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-[#8899bb] hover:text-[#e8eaf0] hover:bg-[#1e2640] transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                {t("navbar.signOut")}
              </button>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold bg-[#f5c518] text-[#080b14] cursor-pointer"
              >
                {t("navbar.getStarted")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
