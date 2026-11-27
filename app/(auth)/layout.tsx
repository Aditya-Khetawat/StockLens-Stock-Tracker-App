import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Activity, DatabaseZap, Sparkles } from "lucide-react";
import { getSessionUser } from "@/lib/better-auth/session";

const PROOF = [
  {
    icon: Activity,
    title: "Live market prices",
    body: "Every quote and every fill comes from the live US market feed.",
  },
  {
    icon: DatabaseZap,
    title: "Orders settled like a real ledger",
    body: "Each trade runs in a database transaction, so cash and shares always add up.",
  },
  {
    icon: Sparkles,
    title: "An AI review of your portfolio",
    body: "Concentration, diversification and what to look at next, on demand.",
  },
];

const Layout = async ({ children }: { children: React.ReactNode }) => {
  if (await getSessionUser()) redirect("/");

  return (
    <main className="grid min-h-dvh bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <section className="flex flex-col px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <Link href="/" aria-label="StockLens" className="w-fit">
          <Image src="/assets/icons/logo.svg" alt="StockLens" width={140} height={32} priority className="h-8 w-auto" />
        </Link>
        <div className="flex flex-1 items-center py-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
        <p className="text-xs text-fg-subtle">Paper trading only. No real money is involved.</p>
      </section>

      <section className="relative hidden overflow-hidden border-l border-line bg-surface lg:flex lg:flex-col">
        <div className="relative flex flex-col gap-10 px-14 pt-16 xl:px-20">
          <div className="max-w-xl">
            <h2 className="text-[2.5rem] leading-[1.08] font-semibold tracking-[-0.03em] text-fg xl:text-5xl">
              Learn the market with real prices.
              <span className="block text-fg-subtle">Risk nothing.</span>
            </h2>
            <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-fg-muted">
              Start with $100,000 in virtual cash, trade US stocks at live prices, and see exactly how your decisions
              would have played out.
            </p>
          </div>
          <ul className="grid max-w-2xl gap-5 xl:grid-cols-3">
            {PROOF.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex flex-col gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-raised text-brand">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-fg">{title}</p>
                <p className="text-[0.8125rem] leading-relaxed text-fg-subtle">{body}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mt-12 flex-1 pl-14 xl:pl-20">
          <div className="absolute inset-y-0 left-14 w-[1100px] overflow-hidden rounded-tl-xl border-t border-l border-line xl:left-20">
            <Image
              src="/assets/images/dashboard.png"
              alt="The StockLens dashboard"
              width={1600}
              height={1291}
              sizes="1100px"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>
    </main>
  );
};
export default Layout;
