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

export default function LoginPage() {
  const router = useRouter();

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Sign In submitted:", data);
    // Redirect to dashboard after sign in
    setTimeout(() => router.push("/"), 1000);
  };

  const handleGoogleSignIn = () => {
    console.log("Google Sign In clicked");
    // Implement Google OAuth here
  };

  const handleResetPassword = () => {
    router.push("/forgot-password");
  };

  const handleCreateAccount = () => {
    router.push("/signup");
  };

  return (
    <SignInPage
      title={
        <div>
          <span className="text-[#0D1F2D]">Welcome to</span>
          <br />
          <span className="text-[#00D4A4]">Flowtex</span>
        </div>
      }
      description="Sign in to access your workspace and continue where you left off."
      heroImageSrc="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80"
      testimonials={testimonials}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
    />
  );
}
