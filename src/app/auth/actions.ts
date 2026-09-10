"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: string;
};

const identifierPasswordSchema = z.object({
  identifier: z.string().min(1, "Enter your email or username."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const usernameSchema = z
  .string()
  .regex(
    /^[A-Za-z][A-Za-z0-9_]{2,19}$/,
    "Username must be 3-20 characters, start with a letter, and use only letters, numbers, or underscores."
  );

const signUpSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  username: usernameSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
  termsAccepted: z.literal("on", {
    message: "You must agree to the Terms of Service and Privacy Policy to continue.",
  }),
});

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

// Bump when the Terms/Privacy content materially changes, so acceptance
// records stay tied to the version a user actually agreed to.
const CURRENT_TERMS_VERSION = "2026-09-10";

const GENERIC_LOGIN_ERROR = "Invalid email/username or password.";

async function getOrigin() {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

export async function signInWithPassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = identifierPasswordSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { identifier, password } = parsed.data;

  let email = identifier;
  if (!identifier.includes("@")) {
    const { data: resolvedEmail, error: lookupError } = await supabase.rpc(
      "get_email_for_username",
      { p_username: identifier }
    );
    if (lookupError || !resolvedEmail) {
      // Don't reveal whether the username exists.
      return { error: GENERIC_LOGIN_ERROR };
    }
    email = resolvedEmail;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  redirect("/dashboard");
}

export async function signUpWithPassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    termsAccepted: formData.get("termsAccepted"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();

  const { data: available, error: availabilityError } = await supabase.rpc(
    "username_available",
    { p_username: parsed.data.username }
  );
  if (availabilityError) {
    return { error: "Could not verify username availability. Please try again." };
  }
  if (!available) {
    return { error: "That username is already taken." };
  }

  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        username: parsed.data.username,
        terms_accepted: "true",
        terms_version: CURRENT_TERMS_VERSION,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    success: "Check your inbox to confirm your email address before signing in.",
  };
}

export async function signInWithMagicLink(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Magic link sent. Check your inbox to continue." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
