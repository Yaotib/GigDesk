"use client";

import { createContext, useContext } from "react";

export type ShellUser = { email: string; displayName: string | null; canApprove: boolean };

const ShellContext = createContext<ShellUser | null>(null);

export function ShellProvider({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  return <ShellContext.Provider value={user}>{children}</ShellContext.Provider>;
}

export function useShellUser(): ShellUser {
  const user = useContext(ShellContext);
  if (!user) throw new Error("useShellUser must be used inside ShellProvider");
  return user;
}
