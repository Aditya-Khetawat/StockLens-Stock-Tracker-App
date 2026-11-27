import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";
import type { Db } from "mongodb";
import { inngest } from "@/lib/inngest/client";
import { sendVerificationEmail } from "@/lib/nodemailer";
import { isDemoEmail } from "@/lib/demo/constants";

const createAuth = (db: Db) =>
  betterAuth({
    database: mongodbAdapter(db),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      // Sign-in stays open (existing users predate verification, and the demo
      // should work instantly). Instead, nothing except the verification email
      // itself is ever sent to an unverified address.
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        if (isDemoEmail(user.email)) return; // undeliverable shared demo address
        await sendVerificationEmail({ email: user.email, name: user.name, url });
      },
      afterEmailVerification: async (user) => {
        // Releases the welcome email, which waits for this event.
        await inngest
          .send({ name: "app/user.verified", data: { email: user.email } })
          .catch((err) => console.error("Failed to emit app/user.verified:", err));
      },
    },
    plugins: [nextCookies()],
  });

type Auth = ReturnType<typeof createAuth>;

let authInstance: Auth | null = null;

export const getAuth = async (): Promise<Auth> => {
  if (authInstance) return authInstance;

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) throw new Error("MongoDB connection not found");

  authInstance = createAuth(db);
  return authInstance;
};

export const auth = await getAuth();
