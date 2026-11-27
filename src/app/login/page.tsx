import type { Metadata } from "next";
import { Music2 } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  "link-invalid": "That sign-in link has expired or was already used. Ask for a new one.",
  "not-on-team": "This account is not on the GigDesk team list.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const errorMessage = error ? ERRORS[error] : undefined;

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 body-strong">
          <span className="grid size-6 place-items-center rounded-sm bg-accent text-on-accent" aria-hidden>
            <Music2 className="size-4" />
          </span>
          GigDesk
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="page-title m-0">Sign in</h1>
          <p className="body m-0 text-ink-muted">We email a one-time link to team members.</p>
        </div>
        {errorMessage && (
          <p role="alert" className="small m-0 rounded-md bg-danger-soft px-3 py-2 text-danger">
            {errorMessage}
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
