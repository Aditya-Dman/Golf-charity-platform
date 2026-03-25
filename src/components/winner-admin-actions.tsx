"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  winnerId: string;
  currentVerification: "pending" | "approved" | "rejected";
  currentPayment: "pending" | "paid";
};

export function WinnerAdminActions({ winnerId, currentVerification, currentPayment }: Props) {
  const router = useRouter();
  const [verification, setVerification] = useState(currentVerification);
  const [payment, setPayment] = useState(currentPayment);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch(`/api/admin/winners/${winnerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationStatus: verification, paymentStatus: payment }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={verification} onChange={(e) => setVerification(e.target.value as typeof verification)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
        <option value="pending">pending</option>
        <option value="approved">approved</option>
        <option value="rejected">rejected</option>
      </select>
      <select value={payment} onChange={(e) => setPayment(e.target.value as typeof payment)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
        <option value="pending">pending</option>
        <option value="paid">paid</option>
      </select>
      <button onClick={save} disabled={busy} className="rounded-lg bg-slate-900 px-3 py-1 text-sm text-white">
        {busy ? "Saving..." : "Update"}
      </button>
    </div>
  );
}
