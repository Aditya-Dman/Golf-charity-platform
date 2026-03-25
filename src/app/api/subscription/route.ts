import { NextRequest, NextResponse } from "next/server";
import { addMonths, addYears, formatISO } from "date-fns";
import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabaseServer";
import { getRequestUser } from "@/lib/requestUser";

const schema = z.object({
  planType: z.enum(["monthly", "yearly"]),
  charityId: z.string().uuid().nullable(),
  charityPercent: z.number().min(10).max(100),
});

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabaseClient();
  const user = await getRequestUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const renewalDate = parsed.data.planType === "monthly" ? addMonths(new Date(), 1) : addYears(new Date(), 1);

  const { error } = await supabase.from("subscriptions").upsert({
    user_id: user.id,
    plan_type: parsed.data.planType,
    status: "active",
    renewal_date: formatISO(renewalDate, { representation: "date" }),
    charity_id: parsed.data.charityId,
    charity_percent: parsed.data.charityPercent,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
