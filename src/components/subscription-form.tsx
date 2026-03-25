"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toCurrency } from "@/lib/utils";
import { getBrowserSupabaseClient } from "@/lib/supabase";

type Charity = {
  id: string;
  name: string;
};

type Props = {
  charities: Charity[];
  monthlyPrice: number;
  yearlyPrice: number;
  currentPlan?: "monthly" | "yearly";
  currentCharityId?: string | null;
  currentCharityPercent?: number;
};

export function SubscriptionForm({
  charities,
  monthlyPrice,
  yearlyPrice,
  currentPlan,
  currentCharityId,
  currentCharityPercent,
}: Props) {
  const router = useRouter();
  const [planType, setPlanType] = useState<"monthly" | "yearly">(currentPlan ?? "monthly");
  const [charityId, setCharityId] = useState<string>(currentCharityId ?? "");
  const [charityPercent, setCharityPercent] = useState<number>(currentCharityPercent ?? 10);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");

  const projectedCharity = useMemo(() => {
    const fee = planType === "monthly" ? monthlyPrice : yearlyPrice;
    return (fee * charityPercent) / 100;
  }, [planType, monthlyPrice, yearlyPrice, charityPercent]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const supabase = getBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch("/api/subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        planType,
        charityId: charityId || null,
        charityPercent,
      }),
    });

    const payload = await res.json();
    if (!res.ok) {
      setMessage(payload.error ?? "Failed to update subscription");
      setBusy(false);
      return;
    }

    setMessage("Subscription updated");
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setPlanType("monthly")}
          className={`rounded-xl border px-3 py-2 text-sm ${planType === "monthly" ? "border-teal-600 bg-teal-50" : "border-slate-300"}`}
        >
          Monthly {toCurrency(monthlyPrice)}
        </button>
        <button
          type="button"
          onClick={() => setPlanType("yearly")}
          className={`rounded-xl border px-3 py-2 text-sm ${planType === "yearly" ? "border-teal-600 bg-teal-50" : "border-slate-300"}`}
        >
          Yearly {toCurrency(yearlyPrice)}
        </button>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm text-slate-700">Select Charity</span>
        <select
          value={charityId}
          onChange={(e) => setCharityId(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
        >
          <option value="">Choose a charity</option>
          {charities.map((charity) => (
            <option key={charity.id} value={charity.id}>
              {charity.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-slate-700">Charity % (min 10)</span>
        <input
          type="number"
          min={10}
          max={100}
          value={charityPercent}
          onChange={(e) => setCharityPercent(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
        />
      </label>

      <p className="text-sm text-slate-600">Projected charity allocation: {toCurrency(projectedCharity)}</p>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}

      <button disabled={busy} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60">
        {busy ? "Saving..." : "Save Subscription"}
      </button>
    </form>
  );
}
