"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAllowedEmail } from "./env";
import { createSupabaseServerClient } from "./supabase";

export type MagicLinkState =
  | { status: "idle" }
  | { status: "sent"; message: string }
  | { status: "error"; message: string };

const emailSchema = z.object({ email: z.email("Enter a valid email address.").max(254) });

/** Generic on purpose: the response never reveals whether an email is on the team list. */
const SENT_MESSAGE = "If this email is on the GigDesk team list, a sign-in link is on its way. Check your inbox.";

export async function sendMagicLink(_prev: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const parsed = emailSchema.safeParse({ email: String(formData.get("email") ?? "").trim() });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }
  const email = parsed.data.email.toLowerCase();

  // Gate 1: server-side allowlist. Gate 2: the before-user-created DB hook. Gate 3: RLS.
  if (!isAllowedEmail(email)) return { status: "sent", message: SENT_MESSAGE };

  const origin = await requestOrigin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm`, shouldCreateUser: true },
  });

  if (error) {
    if (error.status === 429) {
      return { status: "error", message: "Too many sign-in requests. Wait a minute and try again." };
    }
    if (error.status === 403 || error.status === 422) return { status: "sent", message: SENT_MESSAGE };
    console.error("signInWithOtp failed", error.status, error.code);
    return { status: "error", message: "The sign-in link could not be sent. Try again in a minute." };
  }
  return { status: "sent", message: SENT_MESSAGE };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
