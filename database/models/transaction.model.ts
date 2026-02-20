import {
  Schema,
  model,
  models,
  Types,
  type Document,
  type Model,
} from "mongoose";

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: { type: String, required: true, enum: ["BUY", "SELL"] },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
  },
  {
    timestamps: true,
    collection: "transactions",
  },
);

// Compound index for efficient user-symbol queries
transactionSchema.index({ userId: 1, symbol: 1 });

export const Transaction: Model<ITransaction> =
  (models?.Transaction as Model<ITransaction>) ||
  model<ITransaction>("Transaction", transactionSchema);
