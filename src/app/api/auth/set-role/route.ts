import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient, getServiceSupabaseClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-bootstrap");
  if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = getServiceSupabaseClient();
  const { error } = await service.from("profiles").update({ role: "admin" }).eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
