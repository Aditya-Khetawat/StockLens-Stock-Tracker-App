import { Suspense } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import AccountSummary, { AccountSummarySkeleton } from "@/components/dashboard/AccountSummary";
import {
    HEATMAP_WIDGET_CONFIG,
    MARKET_DATA_WIDGET_CONFIG,
    MARKET_OVERVIEW_WIDGET_CONFIG,
    TOP_STORIES_WIDGET_CONFIG
} from "@/lib/constants";

const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

const Home = () => {
    return (
        <div className="flex flex-col gap-12">
            <h1 className="sr-only">Dashboard</h1>

            {/* Streams in once prices arrive; the market sections never wait for it. */}
            <Suspense fallback={<AccountSummarySkeleton />}>
                <AccountSummary />
            </Suspense>

            <section aria-labelledby="markets-heading" className="flex flex-col gap-5">
                <div className="flex items-end justify-between gap-4">
                    <h2 id="markets-heading" className="text-lg font-semibold tracking-tight text-fg">
                        Markets
                    </h2>
                    <p className="text-xs text-fg-subtle">Charts and data by TradingView</p>
                </div>
                <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-3">
                    <TradingViewWidget
                        title="Market overview"
                        scriptUrl={`${scriptUrl}market-overview.js`}
                        config={MARKET_OVERVIEW_WIDGET_CONFIG}
                        height={560}
                    />
                    <div className="xl:col-span-2">
                        <TradingViewWidget
                            title="S&P 500 heatmap"
                            scriptUrl={`${scriptUrl}stock-heatmap.js`}
                            config={HEATMAP_WIDGET_CONFIG}
                            height={560}
                        />
                    </div>
                    <TradingViewWidget
                        title="Top stories"
                        scriptUrl={`${scriptUrl}timeline.js`}
                        config={TOP_STORIES_WIDGET_CONFIG}
                        height={560}
                    />
                    <div className="xl:col-span-2">
                        <TradingViewWidget
                            title="Market quotes"
                            scriptUrl={`${scriptUrl}market-quotes.js`}
                            config={MARKET_DATA_WIDGET_CONFIG}
                            height={560}
                        />
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Home;
