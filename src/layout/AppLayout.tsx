import { Link, Outlet } from "@tanstack/react-router";
import { useIsMobile } from "./useIsMobile";
import { NAV_ITEMS } from "./nav";
import { LanguageBar } from "./LanguageBar";

/*
 * The app shell. Two layouts over one core (ADR-0011): desktop = sidebar
 * authoring station; mobile = bottom-nav review companion. Same routes both
 * ways; only the chrome differs.
 */

export function AppLayout() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}

const linkClass =
  "rounded-[var(--radius-md)] px-3 py-2 text-[var(--color-ink-muted)] [&.active]:bg-[var(--color-surface)] [&.active]:text-[var(--color-ink)]";

function DesktopLayout() {
  return (
    <div className="flex min-h-full">
      <aside className="flex w-56 flex-col gap-4 border-r border-[var(--color-border)] p-4">
        <h1 className="text-2xl">Lexica</h1>
        <LanguageBar />
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((i) => (
            <Link key={i.to} to={i.to} className={linkClass}>
              {i.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

function MobileLayout() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] p-3">
        <h1 className="text-xl">Lexica</h1>
        <LanguageBar compact />
      </header>
      <main className="flex-1 overflow-auto p-4 pb-20">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-[var(--color-border)] bg-[var(--color-bg)] p-2">
        {NAV_ITEMS.map((i) => (
          <Link key={i.to} to={i.to} className={`${linkClass} text-sm`}>
            {i.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
