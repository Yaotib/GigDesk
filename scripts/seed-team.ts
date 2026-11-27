/**
 * Sync team_members from ALLOWED_EMAILS (comma-separated).
 *
 *   pnpm seed:team                         add missing members (can_approve = false)
 *   pnpm seed:team --approver a@b.com      also grant can_approve to a@b.com (repeatable)
 *   pnpm seed:team --prune                 also remove members who are no longer in ALLOWED_EMAILS
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY, so it only runs from a trusted machine.
 */
import { createClient } from "@supabase/supabase-js";

function parseEmailList(raw: string | undefined): string[] {
  return [...new Set((raw ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean))];
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");

  const allowed = parseEmailList(process.env.ALLOWED_EMAILS);
  if (allowed.length === 0) throw new Error("ALLOWED_EMAILS is empty.");

  const args = process.argv.slice(2);
  const approvers = args.flatMap((a, i) => (a === "--approver" && args[i + 1] ? [args[i + 1]!.toLowerCase()] : []));
  const prune = args.includes("--prune");

  for (const a of approvers) {
    if (!allowed.includes(a)) throw new Error(`--approver ${a} is not in ALLOWED_EMAILS.`);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });

  const { error: insertError } = await db
    .from("team_members")
    .upsert(allowed.map((email) => ({ email })), { onConflict: "email", ignoreDuplicates: true });
  if (insertError) throw insertError;

  if (approvers.length > 0) {
    const { error } = await db.from("team_members").update({ can_approve: true }).in("email", approvers);
    if (error) throw error;
  }

  if (prune) {
    const { data, error } = await db.from("team_members").select("email");
    if (error) throw error;
    const stale = (data ?? []).map((r) => r.email as string).filter((e) => !allowed.includes(e));
    if (stale.length > 0) {
      const { error: delError } = await db.from("team_members").delete().in("email", stale);
      if (delError) throw delError;
    }
    console.log(`Removed ${stale.length} member(s) no longer in ALLOWED_EMAILS.`);
  }

  console.log(`Team list synced: ${allowed.length} allowed email(s), ${approvers.length} approver grant(s).`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
