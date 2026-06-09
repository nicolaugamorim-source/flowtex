"use client";

import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { useRouter } from "next/navigation";

const testimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Flowtex transformed how our team collaborates. We save hours every week!"
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "Finally, a tool that remembers everything. Highly recommended!"
  },
];

export default function SignupPage() {
  const router = useRouter();

  const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Sign Up submitted:", data);
    // Redirect to dashboard after sign up
    setTimeout(() => router.push("/"), 1000);
  };

  const handleGoogleSignUp = () => {
    console.log("Google Sign Up clicked");
    // Implement Google OAuth here
  };

  const handleResetPassword = () => {
    router.push("/forgot-password");
  };

  const handleGoToLogin = () => {
    router.push("/login");
  };

  return (
    <SignInPage
      title="Welcome to Flowtex"
      description=""
      heroImageSrc="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80"
      testimonials={testimonials}
      onSignIn={handleSignUp}
      onGoogleSignIn={handleGoogleSignUp}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleGoToLogin}
    />
  );
}
