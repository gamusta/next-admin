"use client";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link";
import { signUp } from "@/lib/auth/actions";
import { useActionState } from "react";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [state, formAction, isPending] = useActionState(
    async (_: unknown, formData: FormData) => {
      return await signUp(formData);
    },
    null
  );

  return (
    <form action={formAction} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>
        {state?.error && (
          <div className="text-destructive text-sm text-center">
            {state.error}
          </div>
        )}
        <Field>
          <FieldLabel htmlFor="firstName">First Name</FieldLabel>
          <Input id="firstName" name="firstName" type="text" placeholder="John" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
          <Input id="lastName" name="lastName" type="text" placeholder="Doe" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" name="password" type="password" required />
          <FieldDescription>
            Must be at least 8 characters long.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
          <Input id="confirmPassword" name="confirmPassword" type="password" required />
        </Field>
        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Account"}
          </Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            Already have an account?{" "}
            <Link href="/sign-in" className="underline underline-offset-4">
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
