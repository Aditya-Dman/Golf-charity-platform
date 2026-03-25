import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import { getServiceSupabaseClient } from "@/lib/supabaseServer";
import { toCurrency } from "@/lib/utils";
import { AdminCharityForm } from "@/components/admin-charity-form";
import { AdminDrawControls } from "@/components/admin-draw-controls";
import { WinnerAdminActions } from "@/components/winner-admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const service = getServiceSupabaseClient();

  const [{ count: usersCount }, { data: activeSubscriptions }, { data: charities }, { data: draws }, { data: winners }] =
    await Promise.all([
      service.from("profiles").select("id", { count: "exact", head: true }),
      service.from("subscriptions").select("user_id, plan_type, charity_percent").eq("status", "active"),
      service.from("charities").select("id, name, featured").order("created_at", { ascending: false }),
      service.from("draws").select("id, month_key, mode, status, draw_numbers, jackpot_rollover").order("created_at", { ascending: false }).limit(10),
      service
        .from("winners")
        .select("id, user_id, amount, verification_status, payment_status, tier, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const totalPrizePool = (winners ?? []).reduce((sum, w) => sum + Number(w.amount), 0);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-rose-700">Administrator</p>
          <h1 className="text-3xl font-semibold text-slate-900">Control Center</h1>
        </div>
        <Link href="/dashboard" className="rounded-xl border border-slate-300 px-4 py-2 text-sm">
          Back to Dashboard
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl bg-white/80 p-4 shadow">
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="mt-1 text-2xl font-semibold">{usersCount ?? 0}</p>
        </article>
        <article className="rounded-2xl bg-white/80 p-4 shadow">
          <p className="text-sm text-slate-500">Active Subscribers</p>
          <p className="mt-1 text-2xl font-semibold">{activeSubscriptions?.length ?? 0}</p>
        </article>
        <article className="rounded-2xl bg-white/80 p-4 shadow">
          <p className="text-sm text-slate-500">Total Prize Pool</p>
          <p className="mt-1 text-2xl font-semibold">{toCurrency(totalPrizePool)}</p>
        </article>
        <article className="rounded-2xl bg-white/80 p-4 shadow">
          <p className="text-sm text-slate-500">Charity Directory</p>
          <p className="mt-1 text-2xl font-semibold">{charities?.length ?? 0}</p>
        </article>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-white/80 p-6 shadow">
          <h2 className="text-xl font-semibold text-slate-900">Draw Management</h2>
          <p className="mt-1 text-sm text-slate-600">Run simulation or publish the official monthly draw.</p>
          <div className="mt-4">
            <AdminDrawControls />
          </div>
          <div className="mt-4 space-y-2">
            {(draws ?? []).map((draw) => (
              <div key={draw.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <p className="font-medium">{draw.month_key} | {draw.status} | {draw.mode}</p>
                <p className="text-slate-600">Numbers: {(draw.draw_numbers as number[]).join(", ")}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-white/80 p-6 shadow">
          <h2 className="text-xl font-semibold text-slate-900">Charity Management</h2>
          <p className="mt-1 text-sm text-slate-600">Create and spotlight active charities.</p>
          <div className="mt-4">
            <AdminCharityForm />
          </div>
          <ul className="mt-4 space-y-2">
            {(charities ?? []).map((charity) => (
              <li key={charity.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <span className="font-medium">{charity.name}</span> {charity.featured ? "(featured)" : ""}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-8 rounded-2xl bg-white/80 p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-900">Winners Verification & Payouts</h2>
        <div className="mt-4 space-y-2">
          {(winners ?? []).map((winner) => (
            <div key={winner.id} className="rounded-xl border border-slate-200 px-3 py-3">
              <p className="text-sm text-slate-600">User: {winner.user_id} | Tier: {winner.tier}</p>
              <p className="font-medium">{toCurrency(Number(winner.amount))}</p>
              <WinnerAdminActions
                winnerId={winner.id}
                currentVerification={winner.verification_status as "pending" | "approved" | "rejected"}
                currentPayment={winner.payment_status as "pending" | "paid"}
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
