"use client";
import { useUiStore, type DashboardView } from "@/store/useUiStore";
import { cn } from "@/lib/utils";

interface NavItem {
  id: DashboardView;
  label: string;
  icon: string; // simple glyph to keep the bundle asset-free
}

const ITEMS: NavItem[] = [
  { id: "live", label: "Live", icon: "◧" },
  { id: "analytics", label: "Analytics", icon: "▦" },
  { id: "risk", label: "Risk", icon: "⚖" },
  { id: "alerts", label: "Alerts", icon: "◔" },
  { id: "backtest", label: "Backtest", icon: "↺" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

/**
 * Primary navigation. Renders as a vertical rail on large screens and a
 * horizontally scrollable bar on tablet/mobile.
 */
export function SideNav() {
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);

  return (
    <nav className="scroll-thin flex gap-1 overflow-x-auto lg:w-48 lg:flex-col lg:overflow-visible">
      {ITEMS.map((item) => {
        const activeItem = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors lg:w-full",
              activeItem ? "text-[var(--accent-contrast)]" : "text-muted hover-app",
            )}
            style={activeItem ? { background: "var(--accent)" } : undefined}
            aria-current={activeItem ? "page" : undefined}
          >
            <span aria-hidden className="text-base leading-none">
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
