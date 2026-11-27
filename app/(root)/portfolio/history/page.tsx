import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, History } from "lucide-react";
import { getSessionUser } from "@/lib/better-auth/session";
import { getTransactionHistory } from "@/lib/data/transactions";
import { formatUsd } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata = { title: "Trade history" };

const PAGE_SIZE = 20;

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/New_York",
});

export default async function TradeHistory({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const { page } = await searchParams;
  const history = await getTransactionHistory(user.id, {
    page: Number(page ?? 1),
    pageSize: PAGE_SIZE,
  });
  const first = (history.page - 1) * PAGE_SIZE + 1;
  const last = first + history.items.length - 1;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/portfolio"
          className="flex w-fit items-center gap-2 text-sm text-fg-muted hover:text-brand transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Portfolio
        </Link>
        <h1 className="watchlist-title">Trade history</h1>
      </div>

      <div className="sheet overflow-hidden">
        {history.total === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center gap-4">
            <History className="h-12 w-12 text-line" aria-hidden="true" />
            <div>
              <p className="text-fg-soft text-lg font-medium">No trades yet</p>
              <p className="text-fg-subtle text-sm mt-2">
                Orders you place from the portfolio or a stock page appear here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <caption className="sr-only">
                  Your trades, newest first. Times are US Eastern.
                </caption>
                <TableHeader>
                  <TableRow className="border-b border-line bg-canvas/40 hover:bg-canvas/40">
                    <TableHead className="text-xs font-medium text-fg-subtle">Date (ET)</TableHead>
                    <TableHead className="text-xs font-medium text-fg-subtle">Order</TableHead>
                    <TableHead className="text-xs font-medium text-fg-subtle">Symbol</TableHead>
                    <TableHead className="text-xs font-medium text-fg-subtle text-right">Shares</TableHead>
                    <TableHead className="text-xs font-medium text-fg-subtle text-right">Price</TableHead>
                    <TableHead className="text-xs font-medium text-fg-subtle text-right">Cash change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.items.map((t) => (
                    <TableRow key={t.id} className="border-b border-line hover:bg-hover">
                      <TableCell className="text-fg-muted whitespace-nowrap figure">
                        <time dateTime={t.createdAt}>{dateFormat.format(new Date(t.createdAt))}</time>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-semibold",
                            t.type === "BUY"
                              ? "bg-gain/15 text-gain-soft"
                              : "bg-loss/15 text-loss-soft",
                          )}
                        >
                          {t.type === "BUY" ? "Buy" : "Sell"}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-fg">
                        <Link
                          href={`/stocks/${t.symbol}`}
                          className="font-mono text-[0.8125rem] hover:text-brand transition-colors"
                        >
                          {t.symbol}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right text-fg figure">
                        {t.quantity}
                      </TableCell>
                      <TableCell className="text-right text-fg-soft figure">
                        {formatUsd(t.price)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-fg figure whitespace-nowrap">
                        {t.type === "BUY" ? "−" : "+"}
                        {formatUsd(t.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <nav
              aria-label="Trade history pages"
              className="flex flex-wrap items-center justify-between gap-4 border-t border-line p-4 text-sm"
            >
              <p className="text-fg-muted figure">
                {first}–{last} of {history.total}
              </p>
              <div className="flex items-center gap-2">
                <PageLink page={history.page - 1} disabled={history.page <= 1}>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Previous
                </PageLink>
                <span className="text-fg-muted figure">
                  Page {history.page} of {history.pageCount}
                </span>
                <PageLink page={history.page + 1} disabled={history.page >= history.pageCount}>
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </PageLink>
              </div>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}

function PageLink({
  page,
  disabled,
  children,
}: {
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const className = "flex items-center gap-1 rounded border border-line px-3 py-1.5";
  if (disabled) {
    return (
      <span aria-disabled="true" className={cn(className, "text-line")}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={`/portfolio/history?page=${page}`}
      className={cn(className, "text-fg-soft hover:bg-raised transition-colors")}
    >
      {children}
    </Link>
  );
}
