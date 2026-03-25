import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { executeDraw } from "@/lib/drawEngine";
import { getMonthKey } from "@/lib/utils";
import { getServiceSupabaseClient } from "@/lib/supabaseServer";

const schema = z.object({
  mode: z.enum(["random", "weighted"]),
  publish: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const adminUser = await requireAdmin();
  const parsed = schema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const service = getServiceSupabaseClient();
  const monthKey = getMonthKey();

  const { data: activeSubscriptions } = await service
    .from("subscriptions")
    .select("user_id, plan_type")
    .eq("status", "active");

  const userIds = (activeSubscriptions ?? []).map((s) => s.user_id);

  const { data: allScores } = userIds.length
    ? await service
        .from("scores")
        .select("user_id, score, score_date, created_at")
        .in("user_id", userIds)
        .order("score_date", { ascending: false })
        .order("created_at", { ascending: false })
    : { data: [] as Array<{ user_id: string; score: number }> };

  const scoresMap = new Map<string, number[]>();
  for (const row of allScores ?? []) {
    const current = scoresMap.get(row.user_id) ?? [];
    if (current.length < 5) {
      current.push(row.score);
      scoresMap.set(row.user_id, current);
    }
  }

  const entries = (activeSubscriptions ?? [])
    .map((sub) => ({
      userId: sub.user_id,
      planType: sub.plan_type as "monthly" | "yearly",
      numbers: scoresMap.get(sub.user_id) ?? [],
    }))
    .filter((entry) => entry.numbers.length === 5);

  const { data: latestPublished } = await service
    .from("draws")
    .select("jackpot_rollover")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentRollover = latestPublished?.jackpot_rollover ?? 0;
  const result = executeDraw(entries, parsed.data.mode, currentRollover);

  const status = parsed.data.publish ? "published" : "simulated";

  const { data: draw, error: drawError } = await service
    .from("draws")
    .upsert({
      month_key: monthKey,
      draw_numbers: result.drawNumbers,
      mode: parsed.data.mode,
      status,
      jackpot_rollover: result.nextJackpotRollover,
      created_by: adminUser.id,
    }, { onConflict: "month_key" })
    .select("id")
    .single();

  if (drawError || !draw) {
    return NextResponse.json({ error: drawError?.message ?? "Failed to store draw" }, { status: 400 });
  }

  if (parsed.data.publish) {
    await service.from("winners").delete().eq("draw_id", draw.id);

    if (result.winners.length > 0) {
      const rows = result.winners.map((w) => ({
        draw_id: draw.id,
        user_id: w.userId,
        tier: w.tier,
        match_count: w.matchCount,
        amount: Number(w.amount.toFixed(2)),
      }));
      await service.from("winners").insert(rows);
    }
  }

  return NextResponse.json({
    ok: true,
    drawNumbers: result.drawNumbers,
    winnersCount: result.winners.length,
    pools: result.prizePools,
    nextJackpotRollover: result.nextJackpotRollover,
    status,
  });
}
