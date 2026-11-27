"use client";

import {
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/actions/watchlist.actions";
import { Star, Trash2 } from "lucide-react";
import React, { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  className = "",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  // `added` is the last state the server confirmed; the optimistic value is
  // shown while a request is in flight and reverts on its own if it fails.
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [shownAdded, setShownAdded] = useOptimistic(added);
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // One request at a time: a double-click cannot race itself.
    if (isPending) return;

    const next = !added;
    startTransition(async () => {
      setShownAdded(next);
      const result = next
        ? await addToWatchlist({ symbol, company })
        : await removeFromWatchlist(symbol);

      if (!result.success) {
        toast.error("Error", { description: result.error });
        return;
      }

      startTransition(() => setAdded(next));
      toast.success(next ? "Added to Watchlist" : "Removed from Watchlist", {
        description: `${company} ${next ? "added to" : "removed from"} your watchlist`,
      });
      onWatchlistChange?.(symbol, next);
    });
  };

  const actionLabel = shownAdded
    ? `Remove ${symbol} from watchlist`
    : `Add ${symbol} to watchlist`;

  if (type === "icon") {
    return (
      <button
        type="button"
        title={actionLabel}
        aria-label={actionLabel}
        aria-pressed={shownAdded}
        aria-busy={isPending}
        disabled={isPending}
        className={`watchlist-icon-btn ${shownAdded ? "watchlist-icon-added" : ""} ${className}`}
        onClick={handleClick}
      >
        {showTrashIcon && shownAdded ? (
          <Trash2 className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Star className="h-5 w-5" fill={shownAdded ? "currentColor" : "none"} aria-hidden="true" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={shownAdded}
      aria-busy={isPending}
      disabled={isPending}
      className={`watchlist-btn ${shownAdded ? "watchlist-remove" : ""}`}
      onClick={handleClick}
    >
      {showTrashIcon && shownAdded ? <Trash2 /> : null}
      <span>{shownAdded ? "Remove from Watchlist" : "Add to Watchlist"}</span>
    </button>
  );
};

export default WatchlistButton;
