import Link from "next/link";
import { env } from "@/lib/env";
import { getServiceSupabaseClient } from "@/lib/supabaseServer";

export default async function Home() {
  let charities: Array<{ id: string; name: string; description: string; featured: boolean }> = [];

  if (env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey) {
    const service = getServiceSupabaseClient();
    const { data } = await service
      .from("charities")
      .select("id, name, description, featured")
      .order("featured", { ascending: false })
      .order("name", { ascending: true });
    charities = data ?? [];
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/50 bg-[radial-gradient(circle_at_30%_20%,#cffafe,transparent_40%),radial-gradient(circle_at_80%_20%,#ffedd5,transparent_35%),linear-gradient(120deg,#f8fafc,#eef2ff)] p-8 shadow-xl md:p-12">
        <p className="text-xs uppercase tracking-[0.2em] text-teal-700">Golf Charity Subscription Platform</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-slate-900 md:text-6xl">
          Play your best five rounds. Win monthly draws. Fund real impact.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-700">
          Subscribe monthly or yearly, submit your last 5 Stableford scores, and join a reward engine where every entry supports a charity you choose.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/auth" className="rounded-xl bg-teal-600 px-5 py-3 font-medium text-white hover:bg-teal-700">
            Subscribe Now
          </Link>
          <Link href="/dashboard" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900 hover:bg-slate-50">
            Open Dashboard
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl bg-white/80 p-5 shadow">
          <h2 className="text-lg font-semibold text-slate-900">How It Works</h2>
          <p className="mt-2 text-slate-700">Enter your latest 5 scores, then you are eligible for the monthly number draw.</p>
        </article>
        <article className="rounded-2xl bg-white/80 p-5 shadow">
          <h2 className="text-lg font-semibold text-slate-900">Prize Engine</h2>
          <p className="mt-2 text-slate-700">5/4/3-match tiers with automatic split logic and jackpot rollover for unclaimed top tier.</p>
        </article>
        <article className="rounded-2xl bg-white/80 p-5 shadow">
          <h2 className="text-lg font-semibold text-slate-900">Charity-First</h2>
          <p className="mt-2 text-slate-700">A minimum 10% of subscription value supports your selected charity.</p>
        </article>
      </section>

      <section className="mt-8 rounded-2xl bg-white/80 p-6 shadow">
        <h2 className="text-2xl font-semibold text-slate-900">Charity Directory</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {charities.map((charity) => (
            <article key={charity.id} className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="font-medium text-slate-900">
                {charity.name} {charity.featured ? <span className="text-xs uppercase text-teal-700">Featured</span> : null}
              </p>
              <p className="mt-1 text-sm text-slate-700">{charity.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
