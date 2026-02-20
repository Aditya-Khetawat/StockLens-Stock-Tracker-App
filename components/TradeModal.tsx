"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { getStockDetails, searchStocks } from "@/lib/actions/finnhub.actions";
import { useDebounce } from "@/hooks/useDebounce";
import { TrendingUp } from "lucide-react";

interface TradeModalProps {
  open: boolean;
  onClose: () => void;
  availableBalance: number;
  defaultSymbol?: string;
  defaultType?: "BUY" | "SELL";
  positions?: Array<{ symbol: string; netQty: number }>;
  disableSuggestions?: boolean;
}

export default function TradeModal({
  open,
  onClose,
  availableBalance,
  defaultSymbol = "",
  defaultType = "BUY",
  positions = [],
  disableSuggestions = false,
}: TradeModalProps) {
  const router = useRouter();
  const [symbol, setSymbol] = useState(defaultSymbol.toUpperCase());
  const [quantity, setQuantity] = useState<string>("");
  const [type, setType] = useState<"BUY" | "SELL">(defaultType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [suggestions, setSuggestions] = useState<
    { symbol: string; name: string }[]
  >([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Max shares owned for current symbol (used in SELL mode)
  const maxOwnedQty =
    type === "SELL"
      ? (positions.find((p) => p.symbol === symbol.trim())?.netQty ?? 0)
      : 0;

  // Calculate estimated total dynamically
  const quantityNum = parseInt(quantity) || 0;
  const estimatedTotal = currentPrice ? quantityNum * currentPrice : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate inputs
    if (!symbol.trim()) {
      setError("Please enter a stock symbol");
      return;
    }

    const quantityNum = parseInt(quantity);
    if (!quantityNum || quantityNum < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          type,
          quantity: quantityNum,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Trade execution failed");
        return;
      }

      // Success - close modal and refresh page
      onClose();
      router.refresh();

      // Reset form
      setSymbol("");
      setQuantity("");
      setType("BUY");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError("");
      setPriceError("");
      onClose();
    }
  };

  // Fetch symbol suggestions when typing (both BUY and SELL)
  const fetchSuggestions = async () => {
    if (disableSuggestions) return;
    const trimmed = symbol.trim();
    if (!trimmed) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSuggestionsLoading(true);
    try {
      const results = await searchStocks(trimmed);
      setSuggestions(
        results.slice(0, 6).map((s) => ({ symbol: s.symbol, name: s.name })),
      );
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const debouncedFetchSuggestions = useDebounce(fetchSuggestions, 300);

  useEffect(() => {
    debouncedFetchSuggestions();
  }, [symbol, type]);

  const handleSelectSuggestion = (selectedSymbol: string) => {
    setSymbol(selectedSymbol);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Fetch stock price when symbol changes (with debouncing)
  useEffect(() => {
    const fetchPrice = async () => {
      const trimmedSymbol = symbol.trim();

      if (!trimmedSymbol) {
        setCurrentPrice(null);
        setPriceError("");
        return;
      }

      setPriceLoading(true);
      setPriceError("");

      try {
        const result = await getStockDetails(trimmedSymbol);

        if (result.success && result.data?.currentPrice) {
          setCurrentPrice(result.data.currentPrice);
        } else {
          setCurrentPrice(null);
          setPriceError("Unable to fetch price for this symbol");
        }
      } catch (err) {
        setCurrentPrice(null);
        setPriceError("Failed to fetch stock price");
      } finally {
        setPriceLoading(false);
      }
    };

    // Debounce the price fetch by 500ms
    const timeoutId = setTimeout(fetchPrice, 500);

    return () => clearTimeout(timeoutId);
  }, [symbol]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-800 border-gray-600 text-gray-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-100">
            Execute Trade
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Available Balance */}
          <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <p className="text-sm text-gray-400">Available Balance</p>
            <p className="text-2xl font-bold text-gray-100">
              $
              {availableBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Trade Type Toggle */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-gray-300">
              Trade Type
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={type === "BUY" ? "default" : "outline"}
                className={
                  type === "BUY"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }
                onClick={() => setType("BUY")}
              >
                BUY
              </Button>
              <Button
                type="button"
                variant={type === "SELL" ? "default" : "outline"}
                className={
                  type === "SELL"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }
                onClick={() => setType("SELL")}
              >
                SELL
              </Button>
            </div>
          </div>

          {/* Symbol Input */}
          <div className="space-y-2">
            <Label htmlFor="symbol" className="text-gray-300">
              Stock Symbol
            </Label>
            <div className="relative">
              <Input
                id="symbol"
                type="text"
                placeholder="e.g., AAPL"
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value.toUpperCase());
                  setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() =>
                  suggestions.length > 0 && setShowSuggestions(true)
                }
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500"
                disabled={loading}
                required
                autoComplete="off"
              />
              {(priceLoading || suggestionsLoading) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
              {/* Suggestions dropdown */}
              {!disableSuggestions &&
                showSuggestions &&
                suggestions.length > 0 && (
                  <ul className="absolute z-50 mt-1 w-full rounded-md border border-gray-600 bg-gray-800 shadow-lg overflow-hidden">
                    {suggestions.map((s) => (
                      <li
                        key={s.symbol}
                        onMouseDown={() => handleSelectSuggestion(s.symbol)}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-700 transition-colors"
                      >
                        <TrendingUp className="h-4 w-4 shrink-0 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-100 text-sm">
                            {s.symbol}
                          </span>
                          <span className="ml-2 text-gray-400 text-xs truncate">
                            {s.name}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
            {priceError && (
              <div className="flex items-center gap-2 text-amber-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{priceError}</span>
              </div>
            )}
            {currentPrice && !priceLoading && (
              <p className="text-sm text-green-500">
                Current Price: ${currentPrice.toFixed(2)}
              </p>
            )}
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quantity" className="text-gray-300">
                Quantity
              </Label>
              {type === "SELL" && maxOwnedQty > 0 && (
                <button
                  type="button"
                  onClick={() => setQuantity(String(maxOwnedQty))}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 border border-red-500/50 hover:border-red-400 rounded px-2 py-0.5 transition-colors"
                >
                  MAX ({maxOwnedQty})
                </button>
              )}
            </div>
            <Input
              id="quantity"
              type="number"
              min={1}
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-500"
              disabled={loading}
              required
            />
          </div>

          {/* Estimated Total */}
          <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <p className="text-sm text-gray-400 mb-1">Estimated Total</p>
            {currentPrice ? (
              <>
                <p className="text-xl font-semibold text-gray-100">
                  $
                  {estimatedTotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {quantityNum || 0} shares × ${currentPrice.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="text-lg text-gray-500">
                {priceLoading ? "Calculating..." : "Enter symbol to see price"}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !currentPrice ||
                priceLoading ||
                !quantityNum ||
                quantityNum < 1
              }
              className={`flex-1 ${
                type === "BUY"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              } text-white`}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : priceLoading ? (
                "Loading price..."
              ) : !currentPrice ? (
                "Enter valid symbol"
              ) : !quantityNum || quantityNum < 1 ? (
                "Enter quantity"
              ) : (
                `${type} ${quantityNum} Share${quantityNum !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
