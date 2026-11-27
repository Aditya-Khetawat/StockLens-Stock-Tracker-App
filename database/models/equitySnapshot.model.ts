import { Schema, model, models, Types, type Model } from "mongoose";

/** End-of-day account value, written by the daily snapshot job. */
export interface IEquitySnapshot {
  userId: Types.ObjectId;
  /** Trading day in UTC, "YYYY-MM-DD". */
  date: string;
  cash: number;
  holdingsValue: number;
  equity: number;
}

const equitySnapshotSchema = new Schema<IEquitySnapshot>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    cash: { type: Number, required: true },
    holdingsValue: { type: Number, required: true },
    equity: { type: Number, required: true },
  },
  { timestamps: true, collection: "equitySnapshots" },
);

// One snapshot per user per day; also serves the per-user date-range query.
equitySnapshotSchema.index({ userId: 1, date: 1 }, { unique: true });

export const EquitySnapshot: Model<IEquitySnapshot> =
  (models?.EquitySnapshot as Model<IEquitySnapshot>) ||
  model<IEquitySnapshot>("EquitySnapshot", equitySnapshotSchema);
