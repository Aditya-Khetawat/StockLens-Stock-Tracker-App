import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import SearchCommand from "@/components/SearchCommand";
import MarketsStrip, { MarketsStripSkeleton } from "@/components/MarketsStrip";

// One bar: logo, sections, search and account; the reader's watchlist prices
// run underneath. Nothing here blocks the page: the strip streams in.
const Header = ({ user }: { user: User }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-xl supports-[backdrop-filter]:bg-canvas/70">
      <div className="container flex h-14 items-stretch gap-4 lg:gap-8">
        <Link href="/" aria-label="StockLens dashboard" className="flex shrink-0 items-center">
          <Image
            src="/assets/icons/logo.svg"
            alt="StockLens"
            width={140}
            height={32}
            priority
            className="h-7 w-auto"
          />
        </Link>

        <nav aria-label="Main" className="hidden md:flex">
          <NavItems />
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <SearchCommand renderAs="field" shortcut />
          </div>
          <UserDropdown user={user} />
        </div>
      </div>

      <Suspense fallback={<MarketsStripSkeleton />}>
        <MarketsStrip userId={user.id} />
      </Suspense>
    </header>
  );
};
export default Header;
