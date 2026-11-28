"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown, History, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth.actions";
import { useState } from "react";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const UserDropdown = ({ user }: { user: User }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close the menu after navigation (state adjusted during render, not in an effect).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${user.name}`}
        className="flex h-9 cursor-pointer items-center gap-2 rounded-md pr-1.5 pl-1 text-sm font-semibold text-fg-soft transition-colors outline-none hover:bg-raised focus-visible:ring-2 focus-visible:ring-brand"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[0.8125rem] font-bold text-on-brand"
        >
          {initials(user.name)}
        </span>
        <span className="hidden max-w-36 truncate xl:inline">{user.name}</span>
        <ChevronDown className="h-4 w-4 text-fg-subtle" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-lg border-line-strong bg-surface p-1 text-fg shadow-[var(--shadow-pop)]"
      >
        <DropdownMenuLabel className="px-3 py-2.5 font-normal">
          <span className="block truncate font-semibold text-fg">{user.name}</span>
          <span className="block truncate text-sm text-fg-muted">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-line" />
        <DropdownMenuItem asChild className="cursor-pointer px-3 py-2 text-sm focus:bg-raised md:hidden">
          <Link href="/portfolio/history">
            <History className="h-4 w-4 text-fg-subtle" aria-hidden="true" />
            Trade history
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer px-3 py-2 text-sm focus:bg-raised"
        >
          <LogOut className="h-4 w-4 text-fg-subtle" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default UserDropdown;
