import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function SignOutPage() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}
