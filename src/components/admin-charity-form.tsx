"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminCharityForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [featured, setFeatured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const res = await fetch("/api/admin/charities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, imageUrl, featured }),
    });

    const payload = await res.json();
    if (!res.ok) {
      setMessage(payload.error ?? "Failed to add charity");
      setBusy(false);
      return;
    }

    setMessage("Charity added");
    setName("");
    setDescription("");
    setImageUrl("");
    setFeatured(false);
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Charity name"
        className="w-full rounded-xl border border-slate-300 px-3 py-2"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="h-24 w-full rounded-xl border border-slate-300 px-3 py-2"
        required
      />
      <input
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Image URL (optional)"
        className="w-full rounded-xl border border-slate-300 px-3 py-2"
      />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Featured charity
      </label>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      <button disabled={busy} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white">
        {busy ? "Saving..." : "Add Charity"}
      </button>
    </form>
  );
}
