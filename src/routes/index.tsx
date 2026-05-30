import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

export function Home() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-3 p-8">
      <h1 className="text-4xl">Lexica</h1>
      <p className="text-[var(--color-ink-muted)]">
        You bring the words. It helps you keep them.
      </p>
    </main>
  );
}
