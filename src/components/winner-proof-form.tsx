"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  winnerId: string;
  currentProofUrl?: string | null;
};

export function WinnerProofForm({ winnerId, currentProofUrl }: Props) {
  const router = useRouter();
  const [proofUrl, setProofUrl] = useState(currentProofUrl ?? "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);

    const res = await fetch(`/api/winners/${winnerId}/proof`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proofUrl }),
    });

    setBusy(false);
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 flex flex-wrap items-center gap-2">
      <input
        value={proofUrl}
        onChange={(e) => setProofUrl(e.target.value)}
        placeholder="Proof screenshot URL"
        className="min-w-56 flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm"
      />
      <button disabled={busy} className="rounded-lg border border-slate-300 px-3 py-1 text-sm">
        {busy ? "Saving..." : "Upload Proof"}
      </button>
    </form>
  );
}
