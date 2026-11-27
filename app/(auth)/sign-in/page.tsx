"use client";

import { useForm } from "react-hook-form";
import InputField from "@/components/forms/InputField";
import FooterLink from "@/components/forms/FooterLink";
import { signInWithEmail } from "@/lib/actions/auth.actions";
import { signInAsDemo } from "@/lib/actions/demo.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const SignIn = () => {
  const router = useRouter();
  const [demoPending, startDemo] = useTransition();

  const openDemo = () =>
    startDemo(async () => {
      const result = await signInAsDemo();
      if (result.success) router.push("/");
      else toast.error("Demo unavailable", { description: result.error });
    });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      const result = await signInWithEmail(data);
      if (result.success) router.push("/");
      else toast.error("Sign in failed", { description: result.error });
    } catch (e) {
      console.error(e);
      toast.error("Sign in failed", {
        description: e instanceof Error ? e.message : "Failed to sign in.",
      });
    }
  };

  return (
    <>
      <h1 className="form-title">Welcome back</h1>
      <p className="mt-2 mb-8 text-sm text-fg-subtle">Sign in to your paper-trading account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          name="email"
          label="Email"
          placeholder="contact@xyz.com"
          register={register}
          error={errors.email}
          validation={{
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Email address is invalid",
            },
          }}
        />

        <InputField
          name="password"
          label="Password"
          placeholder="Enter your password"
          type="password"
          register={register}
          error={errors.password}
          validation={{ required: "Password is required", minLength: 8 }}
        />

        <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 h-11 w-full text-[0.9375rem]">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>

        <div className="flex items-center gap-3 text-xs text-fg-subtle" aria-hidden="true">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={openDemo}
            disabled={demoPending || isSubmitting}
            className="btn-secondary h-11 w-full text-[0.9375rem]"
          >
            {demoPending ? "Opening the demo…" : "Explore the demo account"}
          </button>
          <p className="text-center text-xs text-fg-subtle">
            No sign-up needed. A shared account with real holdings, reset every night.
          </p>
        </div>

        <FooterLink
          text="Don't have an account?"
          linkText="Create an account"
          href="/sign-up"
        />
      </form>
    </>
  );
};
export default SignIn;
