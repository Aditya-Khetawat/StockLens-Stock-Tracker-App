"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signInAsDemo } from "@/lib/actions/demo.actions";
import { cn } from "@/lib/utils";

/** Opens the shared demo account: no sign-up, straight to the dashboard. */
export default function DemoButton({
  className,
  children = "Try the live demo",
  size = "md",
}: {
  className?: string;
  children?: React.ReactNode;
  size?: "md" | "lg";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const open = () =>
    start(async () => {
      const result = await signInAsDemo();
      if (result.success) router.push("/");
      else toast.error("The demo is unavailable", { description: result.error });
    });

  return (
    <button
      type="button"
      onClick={open}
      disabled={pending}
      aria-busy={pending}
      className={cn("btn-primary group", size === "lg" && "h-11 px-5 text-[0.9375rem]", className)}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {pending ? "Opening the demo…" : children}
      {!pending && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
    </button>
  );
}
