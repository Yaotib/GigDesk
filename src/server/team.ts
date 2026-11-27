import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase";

export type TeamMember = { userId: string; email: string; displayName: string | null; canApprove: boolean };

/**
 * The signed-in team member, or a redirect to /login.
 * A signed-in user who is not (or no longer) on the team list is signed out.
 */
export const requireTeamMember = cache(async (): Promise<TeamMember> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const { data, error } = await supabase
    .from("team_members")
    .select("email, display_name, can_approve")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (error) throw new Error(`Could not load team membership: ${error.message}`);
  if (!data) {
    await supabase.auth.signOut();
    redirect("/login?error=not-on-team");
  }
  return { userId: user.id, email: data.email, displayName: data.display_name, canApprove: data.can_approve };
});
