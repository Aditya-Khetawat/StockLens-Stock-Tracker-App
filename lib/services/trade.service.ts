"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { User } from "@/database/models/user.model";
import { Transaction } from "@/database/models/transaction.model";
import { getStockDetails } from "@/lib/actions/finnhub.actions";

interface TradeResult {
  success: boolean;
  data?: {
    transactionId: string;
    symbol: string;
    type: "BUY" | "SELL";
    quantity: number;
    price: number;
    totalAmount: number;
    newBalance: number;
  };
  error?: string;
}

export async function executeTrade(
  userId: string,
  symbol: string,
  type: "BUY" | "SELL",
  quantity: number,
): Promise<TradeResult> {
  // Ensure database connection
  await connectToDatabase();

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Normalize symbol to uppercase
    const upperSymbol = symbol.toUpperCase().trim();

    // Validate inputs
    if (!userId || !upperSymbol || quantity < 1) {
      throw new Error("Invalid trade parameters");
    }

    // Fetch current stock price
    const stockData = await getStockDetails(upperSymbol);
    if (!stockData.success || !stockData.data?.currentPrice) {
      throw new Error("Unable to fetch current stock price");
    }

    const price = stockData.data.currentPrice;
    const totalAmount = price * quantity;

    // Convert userId string to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Load user within session
    const user = await User.findById(userObjectId).session(session);
    if (!user) {
      throw new Error("User not found");
    }

    if (type === "BUY") {
      // Check if user has sufficient balance
      if (user.balance < totalAmount) {
        throw new Error("Insufficient balance");
      }

      // Deduct balance
      user.balance -= totalAmount;
    } else if (type === "SELL") {
      // Fetch all transactions for this user and symbol within session
      const transactions = await Transaction.find({
        userId: userObjectId,
        symbol: upperSymbol,
      }).session(session);

      // Calculate net quantity (total BUY - total SELL)
      let netQuantity = 0;
      for (const txn of transactions) {
        if (txn.type === "BUY") {
          netQuantity += txn.quantity;
        } else if (txn.type === "SELL") {
          netQuantity -= txn.quantity;
        }
      }

      // Check if user has sufficient holdings
      if (netQuantity < quantity) {
        throw new Error("Insufficient holdings");
      }

      // Add proceeds to balance
      user.balance += totalAmount;
    } else {
      throw new Error("Invalid transaction type");
    }

    // Save updated user within session
    await user.save({ session });

    // Create new transaction within session
    const newTransaction = await Transaction.create(
      [
        {
          userId: userObjectId,
          symbol: upperSymbol,
          type,
          quantity,
          price,
          totalAmount,
        },
      ],
      { session },
    );

    // Commit transaction
    await session.commitTransaction();

    return {
      success: true,
      data: {
        transactionId: newTransaction[0]._id.toString(),
        symbol: upperSymbol,
        type,
        quantity,
        price,
        totalAmount,
        newBalance: user.balance,
      },
    };
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();

    console.error("Trade execution failed:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Trade execution failed",
    };
  } finally {
    // Always end session
    await session.endSession();
  }
}
