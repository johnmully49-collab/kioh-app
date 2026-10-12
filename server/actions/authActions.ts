"use server";

import { signIn, signOut } from "@/auth";
import { sendPasswordResetLink as sendPasswordResetEmail } from "@/server/actions/emailActions";

export async function handleGoogleSignIn(redirectTo = "/dashboard") {
  await signIn("google", { redirectTo });
}

export async function handleSignOut() {
  await signOut();
}

export async function sendPasswordResetLink(email: string) {
  return sendPasswordResetEmail(email);
}