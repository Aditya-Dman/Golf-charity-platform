import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { getServiceSupabaseClient } from "@/lib/supabaseServer";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  imageUrl: z.string().url().optional().or(z.literal("")),
  featured: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  await requireAdmin();
  const parsed = schema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const service = getServiceSupabaseClient();
  const { error } = await service.from("charities").insert({
    name: parsed.data.name,
    description: parsed.data.description,
    image_url: parsed.data.imageUrl || null,
    featured: parsed.data.featured,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
