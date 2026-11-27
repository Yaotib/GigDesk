import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="flex flex-col items-start gap-2">
        <h1 className="page-title m-0">Page not found</h1>
        <p className="body m-0 text-ink-muted">This page does not exist or was removed.</p>
        <Link href="/" className="body-strong text-ink underline underline-offset-4">
          Go to Overview
        </Link>
      </div>
    </main>
  );
}
