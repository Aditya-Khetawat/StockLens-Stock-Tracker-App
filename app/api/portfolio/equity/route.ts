import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { User } from "@/database/models/user.model";
import { Transaction } from "@/database/models/transaction.model";

interface PnLDataPoint {
  date: string;
  pnl: number;
}

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function GET() {
  try {
    // Validate session
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Create ObjectId from session.user.id
    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    // Fetch user
    const user = await User.findById(userObjectId).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate startingBalance
    if (typeof user.startingBalance !== "number") {
      console.warn("Missing startingBalance, defaulting to 100000");
    }
    const startingBalance = user.startingBalance ?? 100000;

    // Fetch all transactions sorted by createdAt ascending
    const transactions = await Transaction.find({ userId: userObjectId })
      .sort({ createdAt: 1 })
      .lean();

    // If no transactions, return single point with zero PnL
    if (transactions.length === 0) {
      return NextResponse.json(
        [
          {
            date: new Date().toISOString(),
            pnl: 0,
          },
        ],
        {
          headers: NO_CACHE_HEADERS,
        },
      );
    }

    // Initialize state
    let cash = startingBalance;
    const holdings = new Map<string, number>();
    const lastPrice = new Map<string, number>();
    const pnlData: PnLDataPoint[] = [];

    for (const transaction of transactions) {
      // Validate transaction data
      if (!transaction.createdAt) {
        console.warn(
          "Transaction missing createdAt, skipping:",
          transaction._id,
        );
        continue;
      }

      if (
        typeof transaction.totalAmount !== "number" ||
        transaction.totalAmount <= 0
      ) {
        console.warn(
          "Transaction has invalid totalAmount, skipping:",
          transaction._id,
        );
        continue;
      }

      if (transaction.type !== "BUY" && transaction.type !== "SELL") {
        console.warn(
          "Transaction has invalid type, skipping:",
          transaction._id,
        );
        continue;
      }

      const symbol = transaction.symbol;
      const quantity = transaction.quantity;

      // Apply state updates based on transaction type
      if (transaction.type === "BUY") {
        cash -= transaction.totalAmount;
        holdings.set(symbol, (holdings.get(symbol) || 0) + quantity);
      } else if (transaction.type === "SELL") {
        cash += transaction.totalAmount;
        const newQty = (holdings.get(symbol) || 0) - quantity;

        if (newQty <= 0) {
          holdings.delete(symbol);
        } else {
          holdings.set(symbol, newQty);
        }
      }

      // Update last known price for this symbol
      lastPrice.set(symbol, transaction.price);

      // Calculate total holdings value using last known prices
      let holdingsValue = 0;
      for (const [sym, qty] of holdings) {
        const price = lastPrice.get(sym) || 0;
        holdingsValue += qty * price;
      }

      // Calculate equity and PnL
      const equity = cash + holdingsValue;
      const pnl = Number((equity - startingBalance).toFixed(2));

      // Push exactly one data point per transaction
      pnlData.push({
        date: transaction.createdAt.toISOString(),
        pnl,
      });
    }

    return NextResponse.json(pnlData, {
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("Error fetching portfolio PnL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
