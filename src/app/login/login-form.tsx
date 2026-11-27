"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { sendMagicLink, type MagicLinkState } from "@/server/auth-actions";

const initial: MagicLinkState = { status: "idle" };

export function LoginForm() {
  const [state, action, pending] = useActionState(sendMagicLink, initial);

  if (state.status === "sent") {
    return (
      <p role="status" className="body m-0 rounded-md bg-success-soft px-3 py-2 text-success">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-3">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={state.status === "error" ? "email-error" : undefined}
        />
        {state.status === "error" && (
          <p id="email-error" className="small m-0 text-danger">
            {state.message}
          </p>
        )}
      </div>
      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">
        <Mail aria-hidden />
        {pending ? "Sending link" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
