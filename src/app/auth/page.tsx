"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    const supabase = getBrowserSupabaseClient();

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          throw signInError;
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-6 py-16">
      <section className="grid w-full gap-10 rounded-3xl border border-white/40 bg-white/70 p-8 shadow-xl backdrop-blur-md md:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-teal-700">Digital Heroes Challenge</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900">Join the golf charity draw club</h1>
          <p className="mt-4 text-slate-700">
            Subscribe, enter your latest scores, support a charity, and participate in monthly draw rewards.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="inline-flex rounded-full border border-slate-300 p-1">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-full px-4 py-2 text-sm ${mode === "signup" ? "bg-slate-900 text-white" : "text-slate-600"}`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-full px-4 py-2 text-sm ${mode === "login" ? "bg-slate-900 text-white" : "text-slate-600"}`}
            >
              Login
            </button>
          </div>

          {mode === "signup" ? (
            <label className="block">
              <span className="mb-1 block text-sm text-slate-700">Full Name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                required
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-sm text-slate-700">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-700">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              minLength={6}
              required
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-teal-600 px-4 py-2 font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isSubmitting ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
