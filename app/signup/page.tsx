"use client";

import { SignUpPage } from "@/components/ui/sign-up";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Sign Up submitted:", data);
    // Create account logic here
    setTimeout(() => router.push("/login"), 1000);
  };

  const handleGoogleSignUp = () => {
    console.log("Google Sign Up clicked");
    // Implement Google OAuth here
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  return (
    <SignUpPage
      title="Join Flowtex"
      description="Create your account and unlock early access to the workspace that remembers everything."
      heroImageSrc="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80"
      onSignUp={handleSignUp}
      onGoogleSignUp={handleGoogleSignUp}
      onSignIn={handleSignIn}
    />
  );
}
