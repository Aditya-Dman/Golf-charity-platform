import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { env } from "@/lib/env";
import { getServiceSupabaseClient } from "@/lib/supabaseServer";
import { toCurrency } from "@/lib/utils";
import { ScoreForm } from "@/components/score-form";
import { SignOutButton } from "@/components/signout-button";
import { SubscriptionForm } from "@/components/subscription-form";
import { WinnerProofForm } from "@/components/winner-proof-form";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const service = getServiceSupabaseClient();

  const [{ data: profile }, { data: subscription }, { data: scores }, { data: winners }, { data: latestDraw }, { data: charities }] = await Promise.all([
    service.from("profiles").select("full_name, role").eq("id", user.id).single(),
    service
      .from("subscriptions")
      .select("id, plan_type, status, renewal_date, charity_id, charity_percent, charities(name)")
      .eq("user_id", user.id)
      .maybeSingle(),
    service
      .from("scores")
      .select("id, score, score_date")
      .eq("user_id", user.id)
      .order("score_date", { ascending: false })
      .order("created_at", { ascending: false }),
    service
      .from("winners")
      .select("id, amount, proof_url, verification_status, payment_status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    service
      .from("draws")
      .select("id, month_key, draw_numbers, status")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    service.from("charities").select("id, name").order("name"),
  ]);

  const totalWon = (winners ?? []).reduce((sum, w) => sum + Number(w.amount), 0);
  const charityRelation = subscription?.charities as { name: string } | { name: string }[] | null | undefined;
  const charityName = Array.isArray(charityRelation) ? charityRelation[0]?.name : charityRelation?.name;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-teal-700">Subscriber Dashboard</p>
          <h1 className="text-3xl font-semibold text-slate-900">Welcome, {profile?.full_name || user.email}</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/" className="rounded-xl border border-slate-300 px-4 py-2 text-sm">
            Home
          </Link>
          <SignOutButton />
          {profile?.role === "admin" ? (
            <Link href="/admin" className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">
              Admin Panel
            </Link>
          ) : null}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl bg-white/80 p-4 shadow">
          <p className="text-sm text-slate-500">Subscription</p>
          <p className="mt-1 text-lg font-semibold capitalize">{subscription?.status ?? "inactive"}</p>
          <p className="text-sm text-slate-600">Renewal: {subscription?.renewal_date ?? "-"}</p>
        </article>
        <article className="rounded-2xl bg-white/80 p-4 shadow">
          <p className="text-sm text-slate-500">Plan</p>
          <p className="mt-1 text-lg font-semibold capitalize">{subscription?.plan_type ?? "none"}</p>
        </article>
        <article className="rounded-2xl bg-white/80 p-4 shadow">
          <p className="text-sm text-slate-500">Charity</p>
          <p className="mt-1 text-lg font-semibold">{charityName ?? "Not selected"}</p>
          <p className="text-sm text-slate-600">{subscription?.charity_percent ?? 10}% contribution</p>
        </article>
        <article className="rounded-2xl bg-white/80 p-4 shadow">
          <p className="text-sm text-slate-500">Total Won</p>
          <p className="mt-1 text-lg font-semibold">{toCurrency(totalWon)}</p>
        </article>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-white/80 p-6 shadow">
          <h2 className="text-xl font-semibold text-slate-900">Subscription Setup</h2>
          <p className="mt-1 text-sm text-slate-600">Choose your plan and charity contribution.</p>
          <SubscriptionForm
            charities={charities ?? []}
            monthlyPrice={env.monthlyPlanPrice}
            yearlyPrice={env.yearlyPlanPrice}
            currentPlan={(subscription?.plan_type as "monthly" | "yearly" | undefined) ?? undefined}
            currentCharityId={subscription?.charity_id ?? null}
            currentCharityPercent={subscription?.charity_percent ?? 10}
          />
        </article>

        <article className="rounded-2xl bg-white/80 p-6 shadow">
          <h2 className="text-xl font-semibold text-slate-900">Add Stableford Score</h2>
          <p className="mt-1 text-sm text-slate-600">Only your latest 5 scores are kept automatically.</p>
          <ScoreForm />
          <ul className="mt-4 space-y-2">
            {(scores ?? []).map((score) => (
              <li key={score.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <span className="font-medium">{score.score} points</span>
                <span className="text-sm text-slate-500">{score.score_date}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-white/80 p-6 shadow">
          <h2 className="text-xl font-semibold text-slate-900">Participation & Draws</h2>
          <p className="mt-2 text-slate-700">Draws entered: {scores && scores.length >= 5 && subscription?.status === "active" ? "Eligible" : "Not eligible yet"}</p>
          <p className="text-slate-700">Upcoming draw: End of current month</p>
          <p className="text-slate-700">Latest published draw: {latestDraw?.month_key ?? "Not published yet"}</p>
          {latestDraw ? <p className="text-slate-700">Numbers: {(latestDraw.draw_numbers as number[]).join(", ")}</p> : null}
        </article>

        <article className="rounded-2xl bg-white/80 p-6 shadow">
          <h2 className="text-xl font-semibold text-slate-900">Winnings & Payout Status</h2>
          <ul className="mt-3 space-y-2">
            {(winners ?? []).map((winner) => (
              <li key={winner.id} className="rounded-xl border border-slate-200 px-3 py-2">
                <p className="font-medium">{toCurrency(Number(winner.amount))}</p>
                <p className="text-sm text-slate-600">
                  Verification: {winner.verification_status} | Payment: {winner.payment_status}
                </p>
                <WinnerProofForm winnerId={winner.id} currentProofUrl={winner.proof_url} />
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
