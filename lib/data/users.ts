import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";

async function userCollection() {
  const conn = await connectToDatabase();
  const db = conn.connection.db;
  if (!db) throw new Error("Mongoose connection not connected");
  // Better Auth stores users in the "user" collection.
  return db.collection("user");
}

/** Users who verified their email and have not opted out of the daily news. */
export const getAllUsersForNewsEmail = async (): Promise<UserForNewsEmail[]> => {
  try {
    const users = await (await userCollection())
      .find(
        { email: { $exists: true, $ne: null }, emailVerified: true, newsOptOut: { $ne: true } },
        { projection: { _id: 1, email: 1, name: 1 } },
      )
      .toArray();

    return users
      .filter((user) => user.email && user.name)
      .map((user) => ({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      }));
  } catch (e) {
    console.error("Error fetching users for news email:", e);
    return [];
  }
};

/** Opt a user out of the daily news email. Returns false if no such user. */
export async function setNewsOptOut(userId: string): Promise<boolean> {
  if (!mongoose.isValidObjectId(userId)) return false;
  const result = await (await userCollection()).updateOne(
    { _id: new mongoose.Types.ObjectId(userId) },
    { $set: { newsOptOut: true } },
  );
  return result.matchedCount > 0;
}
