import "server-only";

import nodemailer from "nodemailer";
import {
  WELCOME_EMAIL_TEMPLATE,
  NEWS_SUMMARY_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";
import { escapeHtml, renderTemplate } from "@/lib/email/html";
import { createUnsubscribeToken } from "@/lib/email/unsubscribe";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL!,
    pass: process.env.NODEMAILER_PASSWORD!,
  },
});

// Gmail rewrites any other From address, so send as the authenticated account.
const from = (label: string) => `"${label}" <${process.env.NODEMAILER_EMAIL}>`;

const appUrl = () => (process.env.BETTER_AUTH_URL || "").replace(/\/$/, "");

function unsubscribeUrl(userId: string): string {
  const token = createUnsubscribeToken(userId, process.env.BETTER_AUTH_SECRET!);
  return `${appUrl()}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}

/** Headers for one-click unsubscribe (RFC 8058), honoured by Gmail and Outlook. */
function unsubscribeHeaders(url: string) {
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export const sendVerificationEmail = async ({
  email,
  name,
  url,
}: {
  email: string;
  name: string;
  url: string;
}) => {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(url);

  await transporter.sendMail({
    from: from("StockLens"),
    to: email,
    subject: "Verify your email for StockLens",
    text: `Hi ${name}, confirm your email address to finish setting up StockLens: ${url}\n\nIf you did not sign up, ignore this email.`,
    html: `<p>Hi ${safeName},</p><p>Confirm your email address to finish setting up StockLens:</p><p><a href="${safeUrl}">Verify email</a></p><p>If you did not sign up, ignore this email.</p>`,
  });
};

export const sendWelcomeEmail = async ({
  userId,
  email,
  name,
  intro,
}: WelcomeEmailData & { userId: string }) => {
  const url = unsubscribeUrl(userId);

  await transporter.sendMail({
    from: from("StockLens"),
    to: email,
    subject: "Welcome to StockLens - your stock market toolkit is ready!",
    text: "Thanks for joining StockLens",
    html: renderTemplate(WELCOME_EMAIL_TEMPLATE, {
      text: { name, unsubscribeUrl: url },
      html: { intro },
    }),
    headers: unsubscribeHeaders(url),
  });
};

export const sendNewsSummaryEmail = async ({
  userId,
  email,
  date,
  newsContent,
}: {
  userId: string;
  email: string;
  date: string;
  newsContent: string;
}): Promise<void> => {
  const url = unsubscribeUrl(userId);

  await transporter.sendMail({
    from: from("StockLens News"),
    to: email,
    subject: `📈 Market News Summary Today - ${date}`,
    text: `Today's market news summary from StockLens. Unsubscribe: ${url}`,
    html: renderTemplate(NEWS_SUMMARY_EMAIL_TEMPLATE, {
      text: { date, unsubscribeUrl: url },
      html: { newsContent },
    }),
    headers: unsubscribeHeaders(url),
  });
};
