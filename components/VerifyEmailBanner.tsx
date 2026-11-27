"use client";

import { useState, useTransition } from "react";
import { MailWarning, X } from "lucide-react";
import { toast } from "sonner";
import { resendVerificationEmail } from "@/lib/actions/verification.actions";

/** Shown to signed-in users whose email address is not verified yet. */
export default function VerifyEmailBanner({ email }: { email: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (dismissed) return null;

  const resend = () =>
    startTransition(async () => {
      const result = await resendVerificationEmail();
      if (result.success) {
        setSent(true);
        toast.success("Verification email sent", {
          description: `Check ${email}. The link expires in an hour.`,
        });
      } else {
        toast.error(result.error);
      }
    });

  return (
    <section aria-label="Email verification" className="border-b border-brand/30 bg-brand/10">
      <div className="container flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm">
        <MailWarning className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
        <p className="min-w-60 flex-1 text-fg-soft">
          {sent ? (
            <>
              We sent a new link to <span className="font-medium text-fg">{email}</span>. Open it to
              verify your address.
            </>
          ) : (
            <>
              Verify <span className="font-medium text-fg">{email}</span> to get your welcome email
              and the daily market news.
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resend}
            disabled={pending}
            aria-busy={pending}
            className="rounded-md bg-brand px-3 py-1.5 font-medium text-ink transition-colors hover:bg-brand-bright disabled:cursor-progress disabled:opacity-70"
          >
            {pending ? "Sending…" : sent ? "Send again" : "Resend email"}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Hide this message"
            className="rounded-md p-1.5 text-fg-subtle transition-colors hover:text-fg"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
