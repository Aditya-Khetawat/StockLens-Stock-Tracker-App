"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, activeNavHref } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Section tabs. The current section carries a gold underline. */
const NavItems = () => {
  const active = activeNavHref(usePathname());

  return (
    <ul className="flex items-stretch gap-1">
      {NAV_ITEMS.map(({ href, label }) => {
        const current = href === active;
        return (
          <li key={href} className="flex">
            <Link
              href={href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "relative flex items-center px-3 text-sm font-medium transition-colors duration-150",
                "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:transition-colors",
                current
                  ? "text-fg after:bg-brand"
                  : "text-fg-subtle after:bg-transparent hover:text-fg",
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
export default NavItems;
