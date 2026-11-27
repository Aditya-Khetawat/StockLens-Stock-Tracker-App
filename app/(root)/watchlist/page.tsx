import SearchCommand from "@/components/SearchCommand";
import { getWatchlistWithData } from "@/lib/actions/watchlist.actions";
import WatchlistTable from "@/components/WatchlistTable";

export const metadata = { title: "Watchlist" };

const Watchlist = async () => {
  const watchlist = await getWatchlistWithData();

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Watchlist</h1>
          <p className="mt-1 text-sm text-fg-subtle">
            {watchlist.length === 0
              ? "Companies you follow, with live prices"
              : `${watchlist.length} ${watchlist.length === 1 ? "company" : "companies"} · prices up to a minute old`}
          </p>
        </div>
        <SearchCommand label="Add a stock" />
      </div>
      <WatchlistTable watchlist={watchlist} />
    </section>
  );
};

export default Watchlist;
