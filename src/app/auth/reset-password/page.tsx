"use client";

import Link from "next/link";
import { useState } from "react";
import { AcaciaLogo } from "@/components/branding/acacia-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/sign-in`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("Reset email sent. Please check your inbox.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#d8f3f1,_#f8fafc_55%)] px-4 py-12">
      <Card className="w-full max-w-md border-teal-100 shadow-lg shadow-teal-100/40">
        <CardContent className="space-y-6 p-8">
          <AcaciaLogo className="justify-center" showText />
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold text-slate-900">Reset password</h1>
            <p className="text-sm text-slate-600">Enter your work email to receive a secure reset link.</p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="space-y-1.5 text-sm text-slate-700">
              <span>Email</span>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            <Button type="submit" disabled={loading} className="w-full bg-teal-700 text-white hover:bg-teal-800">
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>

          <Link href="/auth/sign-in" className="block text-center text-sm text-teal-700 hover:underline">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
