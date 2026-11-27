import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/supabase";

const querySchema = z.object({
  token_hash: z.string().min(1).max(512),
  type: z.enum(["email", "magiclink", "signup"]),
});

/** Magic-link landing. Uses token_hash, so the link works on any device or browser. */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  const fail = new URL("/login?error=link-invalid", request.url);
  if (!parsed.success) return NextResponse.redirect(fail);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: parsed.data.token_hash, type: parsed.data.type });
  if (error) return NextResponse.redirect(fail);

  return NextResponse.redirect(new URL("/", request.url));
}
