import "server-only";
import { z } from "zod";

/** Comma-separated emails → lowercase, trimmed, de-duplicated list. */
export function parseEmailList(raw: string | undefined): string[] {
  if (!raw) return [];
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(emails)];
}

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_MODEL: z.string().min(1).default("openai/gpt-oss-120b"),
  GROQ_STT_MODEL: z.string().min(1).default("whisper-large-v3-turbo"),
  AI_MODE: z.enum(["live", "mock"]).default("mock"),
  ALLOWED_EMAILS: z.string().default(""),
  APP_TIMEZONE: z.string().default("Africa/Accra"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema> & { allowedEmails: string[] };

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const keys = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid server environment: ${keys}. See .env.example.`);
  }
  cached = { ...parsed.data, allowedEmails: parseEmailList(parsed.data.ALLOWED_EMAILS) };
  return cached;
}

export function isAllowedEmail(email: string): boolean {
  return serverEnv().allowedEmails.includes(email.trim().toLowerCase());
}
