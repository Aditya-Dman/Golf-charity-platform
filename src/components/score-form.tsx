"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase";

export function ScoreForm() {
  const router = useRouter();
  const [score, setScore] = useState(18);
  const [scoreDate, setScoreDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const supabase = getBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch("/api/scores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ score, scoreDate }),
    });

    const payload = await res.json();
    if (!res.ok) {
      setMessage(payload.error ?? "Failed to add score");
      setBusy(false);
      return;
    }

    setMessage("Score saved. Latest 5 scores are retained automatically.");
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm text-slate-700">Score (1-45)</span>
        <input
          type="number"
          min={1}
          max={45}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-slate-700">Date</span>
        <input
          type="date"
          value={scoreDate}
          onChange={(e) => setScoreDate(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
          required
        />
      </label>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}

      <button disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
        {busy ? "Submitting..." : "Add Score"}
      </button>
    </form>
  );
}
