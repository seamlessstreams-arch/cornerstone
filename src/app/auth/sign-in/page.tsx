"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AcaciaLogo } from "@/components/branding/acacia-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const getNextPath = (): string => {
    if (typeof window !== "undefined") {
      const next = new URLSearchParams(window.location.search).get("next");
      if (next && next.startsWith("/")) {
        return next;
      }
    }
    return "/dashboard";
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace(getNextPath());
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#d8f3f1,_#f8fafc_55%)] px-4 py-12">
      <Card className="w-full max-w-md border-teal-100 shadow-lg shadow-teal-100/40">
        <CardContent className="space-y-6 p-8">
          <AcaciaLogo className="justify-center" showText />
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold text-slate-900">Sign in to Cornerstone</h1>
            <p className="text-sm text-slate-600">Secure access for Acacia Therapy Homes staff</p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="space-y-1.5 text-sm text-slate-700">
              <span>Email</span>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="space-y-1.5 text-sm text-slate-700">
              <span>Password</span>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full bg-teal-700 text-white hover:bg-teal-800">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <Link href="/auth/reset-password" className="text-teal-700 hover:underline">
              Forgot password?
            </Link>
            <span className="text-slate-500">Protected by Supabase Auth</span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
