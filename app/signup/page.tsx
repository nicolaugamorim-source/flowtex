import { redirect } from "next/navigation";

// Sign-up is Google-only now, same flow as sign-in (the OAuth callback
// creates the account on first login) — redirect any old links here.
export default function SignupPage() {
  redirect("/login");
}
