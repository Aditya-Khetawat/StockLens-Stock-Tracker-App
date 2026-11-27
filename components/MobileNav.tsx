"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, LayoutDashboard, Search, Star } from "lucide-react";
import SearchCommand from "@/components/SearchCommand";
import { activeNavHref } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
] as const;

const tab =
  "relative flex flex-1 flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 text-xs font-semibold transition-colors";

/** Bottom tab bar on phones, where the masthead has no room for sections. */
export default function MobileNav() {
  const active = activeNavHref(usePathname());
  // Trade history lives under Portfolio on phones.
  const current = (href: string) => active === href || (href === "/portfolio" && active === "/portfolio/history");

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="flex">
        <TabLink {...LINKS[0]} active={current(LINKS[0].href)} />
        <li className="flex flex-1">
          <SearchCommand
            renderAs="custom"
            trigger={
              <>
                <Search className="h-5 w-5" aria-hidden="true" />
                Search
              </>
            }
            triggerClassName={cn(tab, "text-fg-muted hover:text-fg")}
          />
        </li>
        {LINKS.slice(1).map((link) => (
          <TabLink key={link.href} {...link} active={current(link.href)} />
        ))}
      </ul>
    </nav>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  active: boolean;
}) {
  return (
    <li className="flex flex-1">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          tab,
          "before:absolute before:inset-x-6 before:top-0 before:h-[3px] before:rounded-b-sm",
          active ? "text-brand before:bg-brand" : "text-fg-muted before:bg-transparent hover:text-fg",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden={true} />
        {label}
      </Link>
    </li>
  );
}
