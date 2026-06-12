"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Trophy, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError || "");
  const [success, setSuccess] = useState("");

  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else router.push(redirect);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!username.trim()) { setError("Username is required"); setLoading(false); return; }

    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username: username.trim() } },
    });

    if (error) { setError(error.message); setLoading(false); }
    else { setSuccess("Account created! Check your email to confirm, then sign in."); setLoading(false); }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5c518] to-[#c9a000] flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-7 h-7 text-[#080b14]" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-black text-[#e8eaf0]">WC2026 Predictor</h1>
        <p className="text-[#8899bb] mt-2">Sign in to start predicting</p>
      </div>

      <div className="bg-[#0e1220] border border-[#1e2640] rounded-2xl p-6">
        <Tabs defaultValue="login">
          <TabsList className="mb-6">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#ef444415] border border-[#ef444430] text-[#ef4444] text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-[#22c55e15] border border-[#22c55e30] text-[#22c55e] text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} required />
              <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" icon={Lock} required />
              <Button type="submit" variant="gold" size="lg" loading={loading} className="w-full mt-2">
                Sign In
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <InputField label="Username" type="text" value={username} onChange={setUsername} placeholder="footballfan99" icon={User} required />
              <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} required />
              <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="Min 6 characters" icon={Lock} required />
              <Button type="submit" variant="gold" size="lg" loading={loading} className="w-full mt-2">
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#1e2640]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0e1220] px-2 text-[#4a5570]">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </Button>
      </div>

      <p className="text-center text-[#4a5570] text-sm mt-6">
        By continuing, you agree to our terms of service.
      </p>
    </div>
  );
}

function InputField({
  label, type, value, onChange, placeholder, icon: Icon, required,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: React.ComponentType<{ className?: string }>; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#8899bb] mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5570]" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#141928] border border-[#1e2640] text-[#e8eaf0] placeholder-[#4a5570] focus:outline-none focus:border-[#f5c518] focus:ring-1 focus:ring-[#f5c51840] transition-all duration-200 text-sm cursor-text"
        />
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16">
      <Suspense fallback={<div className="text-[#8899bb]">Loading...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
