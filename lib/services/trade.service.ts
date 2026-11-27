import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { User } from "@/database/models/user.model";
import { Transaction } from "@/database/models/transaction.model";
import { getQuote } from "@/lib/finnhub/client";
import { roundMoney } from "@/lib/trading/money";
import { parseTradeRequest, type TradeRequest } from "@/lib/trading/validation";

export type TradeResult =
  | {
      success: true;
      data: {
        transactionId: string;
        symbol: string;
        type: "BUY" | "SELL";
        quantity: number;
        price: number;
        totalAmount: number;
        newBalance: number;
      };
    }
  | { success: false; error: string };

type TradeDeps = {
  /** Current price in dollars, or null when the symbol has no quote. */
  getPrice: (symbol: string) => Promise<number | null>;
};

const defaultDeps: TradeDeps = {
  getPrice: async (symbol) => (await getQuote(symbol))?.price ?? null,
};

/** Expected business-rule failures. Their messages are safe to show users. */
class TradeRejected extends Error {}

export async function executeTrade(
  userId: string,
  request: TradeRequest,
  deps: TradeDeps = defaultDeps,
): Promise<TradeResult> {
  const parsed = parseTradeRequest(request);
  if (!parsed.success) return { success: false, error: parsed.error };
  const { symbol, type, quantity } = parsed.data;

  if (!mongoose.isValidObjectId(userId)) {
    return { success: false, error: "User not found." };
  }

  let price: number;
  try {
    const quoted = await deps.getPrice(symbol);
    if (!quoted || quoted <= 0) {
      return { success: false, error: "Price unavailable for this symbol." };
    }
    price = roundMoney(quoted);
  } catch (err) {
    console.error("Trade price lookup failed:", err);
    return { success: false, error: "Price service unavailable. Please try again." };
  }

  const totalAmount = roundMoney(price * quantity);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  await connectToDatabase();
  const session = await mongoose.startSession();

  try {
    let transactionId = "";
    let newBalance = 0;

    // withTransaction re-runs this callback on transient errors such as
    // write conflicts from concurrent orders, so every read happens inside it.
    await session.withTransaction(async () => {
      const user = await User.findById(userObjectId).session(session);
      if (!user) throw new TradeRejected("User not found.");

      if (type === "BUY") {
        if (user.balance < totalAmount) {
          throw new TradeRejected("Insufficient balance.");
        }
        user.balance = roundMoney(user.balance - totalAmount);
      } else {
        const [holding] = await Transaction.aggregate<{ netQuantity: number }>([
          { $match: { userId: userObjectId, symbol } },
          {
            $group: {
              _id: null,
              netQuantity: {
                $sum: {
                  $cond: [{ $eq: ["$type", "BUY"] }, "$quantity", { $multiply: ["$quantity", -1] }],
                },
              },
            },
          },
        ]).session(session);

        if ((holding?.netQuantity ?? 0) < quantity) {
          throw new TradeRejected("Insufficient holdings.");
        }
        user.balance = roundMoney(user.balance + totalAmount);
      }

      await user.save({ session });

      const [created] = await Transaction.create(
        [{ userId: userObjectId, symbol, type, quantity, price, totalAmount }],
        { session },
      );

      transactionId = created._id.toString();
      newBalance = user.balance;
    });

    return {
      success: true,
      data: { transactionId, symbol, type, quantity, price, totalAmount, newBalance },
    };
  } catch (err) {
    if (err instanceof TradeRejected) {
      return { success: false, error: err.message };
    }
    console.error("Trade execution failed:", err);
    return { success: false, error: "Trade could not be completed. Please try again." };
  } finally {
    await session.endSession();
  }
}
