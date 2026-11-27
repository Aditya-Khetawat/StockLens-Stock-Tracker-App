"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, LayoutDashboard, Search, Star } from "lucide-react";
import SearchCommand from "@/components/SearchCommand";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
] as const;

const tab = "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors";

/** Bottom tab bar on phones, where the header has no room for navigation. */
export default function MobileNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur sm:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex">
        {LINKS.slice(0, 1).map((link) => (
          <TabLink key={link.href} {...link} active={isActive(link.href)} />
        ))}
        <li className="flex flex-1">
          <SearchCommand
            renderAs="custom"
            trigger={
              <>
                <Search className="h-5 w-5" aria-hidden="true" />
                Search
              </>
            }
            triggerClassName={cn(tab, "text-fg-subtle hover:text-brand")}
          />
        </li>
        {LINKS.slice(1).map((link) => (
          <TabLink key={link.href} {...link} active={isActive(link.href)} />
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
        className={cn(tab, active ? "text-brand" : "text-fg-subtle hover:text-fg")}
      >
        <Icon className="h-5 w-5" aria-hidden={true} />
        {label}
      </Link>
    </li>
  );
}
