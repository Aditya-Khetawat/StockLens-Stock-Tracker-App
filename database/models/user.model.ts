import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IUser extends Document {
  balance: number;
  startingBalance: number;
}

const userSchema = new Schema<IUser>(
  {
    balance: {
      type: Number,
      default: 100000,
      min: 0,
    },
    startingBalance: {
      type: Number,
      default: 100000,
    },
  },
  {
    timestamps: true,
    collection: "user", // must match Better Auth
  },
);

export const User: Model<IUser> =
  (models?.User as Model<IUser>) || model<IUser>("User", userSchema);
