import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { getServiceSupabaseClient } from "@/lib/supabaseServer";

const schema = z.object({
  verificationStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  paymentStatus: z.enum(["pending", "paid"]).optional(),
  proofUrl: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await context.params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (parsed.data.verificationStatus) payload.verification_status = parsed.data.verificationStatus;
  if (parsed.data.paymentStatus) payload.payment_status = parsed.data.paymentStatus;
  if (parsed.data.proofUrl !== undefined) payload.proof_url = parsed.data.proofUrl || null;

  const service = getServiceSupabaseClient();
  const { error } = await service.from("winners").update(payload).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
