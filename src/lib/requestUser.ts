import { NextRequest } from "next/server";
import { getServerSupabaseClient, getServiceSupabaseClient } from "@/lib/supabaseServer";

export async function getRequestUser(req: NextRequest) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return user;
  }

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length);
  if (!token) {
    return null;
  }

  const service = getServiceSupabaseClient();
  const {
    data: { user: tokenUser },
  } = await service.auth.getUser(token);

  return tokenUser ?? null;
}
