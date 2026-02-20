import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { User } from "@/database/models/user.model";
import { Transaction } from "@/database/models/transaction.model";
import { getStockDetails } from "@/lib/actions/finnhub.actions";

interface Position {
  symbol: string;
  netQty: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  gainPercent: number;
  allocationPercent: number;
}

interface Portfolio {
  balance: number;
  positions: Position[];
  totalMarketValue: number;
  totalUnrealizedPnL: number;
  totalEquity: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export async function getUserPortfolio(userId: string): Promise<Portfolio> {
  // Connect to database
  await connectToDatabase();

  // Convert userId to ObjectId
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Fetch user
  const user = await User.findById(userObjectId);
  if (!user) {
    throw new Error("User not found");
  }

  const balance = user.balance || 0;
  const startingBalance = user.startingBalance || 100000;

  // Fetch all transactions for the user
  const transactions = await Transaction.find({ userId: userObjectId }).sort({
    createdAt: 1,
  });

  // Replay transactions sequentially to track cost basis per symbol.
  // When a position is fully closed (quantity reaches 0), the state is reset
  // so that future buys start with a fresh cost basis.
  const symbolState = new Map<
    string,
    { quantity: number; totalCost: number }
  >();

  for (const txn of transactions) {
    const symbol = txn.symbol;

    if (txn.type === "BUY") {
      if (!symbolState.has(symbol)) {
        symbolState.set(symbol, { quantity: 0, totalCost: 0 });
      }
      const state = symbolState.get(symbol)!;
      state.quantity += txn.quantity;
      state.totalCost += txn.totalAmount;
    } else if (txn.type === "SELL") {
      if (symbolState.has(symbol)) {
        const state = symbolState.get(symbol)!;
        // Reduce totalCost proportionally based on average cost before the sell
        const avgCostBeforeSell =
          state.quantity > 0 ? state.totalCost / state.quantity : 0;
        state.totalCost -= avgCostBeforeSell * txn.quantity;
        state.quantity -= txn.quantity;

        // If position is fully closed, reset cost basis entirely
        if (state.quantity <= 0) {
          symbolState.delete(symbol);
        }
      }
    }
  }

  // Active positions are those remaining in symbolState after replay
  const activeSymbols: Array<{
    symbol: string;
    netQty: number;
    avgCost: number;
  }> = [];

  for (const [symbol, state] of symbolState.entries()) {
    if (state.quantity <= 0) continue;

    const avgCost = state.quantity > 0 ? state.totalCost / state.quantity : 0;

    activeSymbols.push({
      symbol,
      netQty: state.quantity,
      avgCost,
    });
  }

  // Fetch all stock prices in parallel
  const priceResults = await Promise.all(
    activeSymbols.map(({ symbol }) => getStockDetails(symbol)),
  );

  // Build positions array with fetched prices (without allocationPercent yet)
  const tempPositions: Array<{
    symbol: string;
    netQty: number;
    avgCost: number;
    currentPrice: number;
    marketValue: number;
    unrealizedPnL: number;
    gainPercent: number;
  }> = [];

  for (let i = 0; i < activeSymbols.length; i++) {
    const { symbol, netQty, avgCost } = activeSymbols[i];
    const stockData = priceResults[i];

    // Validate price
    if (
      !stockData.success ||
      !stockData.data?.currentPrice ||
      stockData.data.currentPrice <= 0
    ) {
      console.warn(
        `Unable to fetch valid price for ${symbol}, skipping position`,
      );
      continue;
    }

    const currentPrice = stockData.data.currentPrice;
    const marketValue = netQty * currentPrice;
    const unrealizedPnL = (currentPrice - avgCost) * netQty;
    const gainPercent =
      avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0;

    tempPositions.push({
      symbol,
      netQty,
      avgCost,
      currentPrice,
      marketValue,
      unrealizedPnL,
      gainPercent,
    });
  }

  // Calculate total market value
  const totalMarketValue = tempPositions.reduce(
    (sum, pos) => sum + pos.marketValue,
    0,
  );

  // Add allocationPercent to each position
  const positions: Position[] = tempPositions.map((pos) => ({
    ...pos,
    allocationPercent:
      totalMarketValue > 0 ? (pos.marketValue / totalMarketValue) * 100 : 0,
  }));

  // Calculate portfolio-level metrics
  const totalUnrealizedPnL = positions.reduce(
    (sum, pos) => sum + pos.unrealizedPnL,
    0,
  );
  const totalEquity = balance + totalMarketValue;
  const totalReturn = totalEquity - startingBalance;

  // Calculate return percentage (avoid division by zero)
  const totalReturnPercent =
    startingBalance > 0 ? (totalReturn / startingBalance) * 100 : 0;

  return {
    balance,
    positions,
    totalMarketValue,
    totalUnrealizedPnL,
    totalEquity,
    totalReturn,
    totalReturnPercent,
  };
}
