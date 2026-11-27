import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { Transaction } from "@/database/models/transaction.model";

export type TransactionRow = {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  totalAmount: number;
  /** ISO timestamp. */
  createdAt: string;
};

export type TransactionPage = {
  items: TransactionRow[];
  total: number;
  /** The page actually returned, clamped to 1..pageCount. */
  page: number;
  pageCount: number;
};

/** A user's trades, newest first. Uses the { userId, createdAt } index. */
export async function getTransactionHistory(
  userId: string,
  { page, pageSize }: { page: number; pageSize: number },
): Promise<TransactionPage> {
  await connectToDatabase();
  const filter = { userId: new mongoose.Types.ObjectId(userId) };

  const total = await Transaction.countDocuments(filter);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1), pageCount);

  const docs = await Transaction.find(filter, {
    symbol: 1, type: 1, quantity: 1, price: 1, totalAmount: 1, createdAt: 1,
  })
    .sort({ createdAt: -1, _id: -1 })
    .skip((current - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return {
    items: docs.map((d) => ({
      id: d._id.toString(),
      symbol: d.symbol,
      type: d.type,
      quantity: d.quantity,
      price: d.price,
      totalAmount: d.totalAmount,
      createdAt: new Date(d.createdAt).toISOString(),
    })),
    total,
    page: current,
    pageCount,
  };
}
