"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminDrawControls() {
  const router = useRouter();
  const [mode, setMode] = useState<"random" | "weighted">("random");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<string>("");

  async function run(publish: boolean) {
    setBusy(true);
    setOutput("");

    const res = await fetch("/api/admin/draw/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, publish }),
    });

    const payload = await res.json();
    if (!res.ok) {
      setOutput(payload.error ?? "Draw failed");
      setBusy(false);
      return;
    }

    setOutput(`Mode: ${mode} | Numbers: ${payload.drawNumbers.join(", ")} | Winners: ${payload.winnersCount}`);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("random")}
          className={`rounded-xl border px-3 py-2 text-sm ${mode === "random" ? "border-teal-600 bg-teal-50" : "border-slate-300"}`}
        >
          Random
        </button>
        <button
          type="button"
          onClick={() => setMode("weighted")}
          className={`rounded-xl border px-3 py-2 text-sm ${mode === "weighted" ? "border-teal-600 bg-teal-50" : "border-slate-300"}`}
        >
          Weighted
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => run(false)}
          disabled={busy}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
        >
          Simulate Draw
        </button>
        <button
          type="button"
          onClick={() => run(true)}
          disabled={busy}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Publish Draw
        </button>
      </div>

      {output ? <p className="text-sm text-slate-700">{output}</p> : null}
    </div>
  );
}
