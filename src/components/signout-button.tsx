"use client";

import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase";

export function SignOutButton() {
  const router = useRouter();

  async function onSignOut() {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
    >
      Sign Out
    </button>
  );
}
