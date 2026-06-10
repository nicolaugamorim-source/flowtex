"use client";

import { signUp, signIn } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { ErrorMessage } from "./error-message";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Code, Eye, EyeOff, User } from "lucide-react";
import Link from "next/link";
import { JSX, SVGProps, useState } from "react";
import { PasswordStrengthMeter } from "./password-strength-meter";

const Logo = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg
    fill="currentColor"
    height="48"
    viewBox="0 0 40 48"
    width="40"
    {...props}
  >
    <clipPath id="a">
      <path d="m0 0h40v48h-40z" />
    </clipPath>
    <g clipPath="url(#a)">
      <path d="m25.0887 5.05386-3.933-1.05386-3.3145 12.3696-2.9923-11.16736-3.9331 1.05386 3.233 12.0655-8.05262-8.0526-2.87919 2.8792 8.83271 8.8328-10.99975-2.9474-1.05385625 3.933 12.01860625 3.2204c-.1376-.5935-.2104-1.2119-.2104-1.8473 0-4.4976 3.646-8.1436 8.1437-8.1436 4.4976 0 8.1436 3.646 8.1436 8.1436 0 .6313-.0719 1.2459-.2078 1.8359l10.9227 2.9267 1.0538-3.933-12.0664-3.2332 11.0005-2.9476-1.0539-3.933-12.0659 3.233 8.0526-8.0526-2.8792-2.87916-8.7102 8.71026z" />
      <path d="m27.8723 26.2214c-.3372 1.4256-1.0491 2.7063-2.0259 3.7324l7.913 7.9131 2.8792-2.8792z" />
      <path d="m25.7665 30.0366c-.9886 1.0097-2.2379 1.7632-3.6389 2.1515l2.8794 10.746 3.933-1.0539z" />
      <path d="m21.9807 32.2274c-.65.1671-1.3313.2559-2.0334.2559-.7522 0-1.4806-.102-2.1721-.2929l-2.882 10.7558 3.933 1.0538z" />
      <path d="m17.6361 32.1507c-1.3796-.4076-2.6067-1.1707-3.5751-2.1833l-7.9325 7.9325 2.87919 2.8792z" />
      <path d="m13.9956 29.8973c-.9518-1.019-1.6451-2.2826-1.9751-3.6862l-10.95836 2.9363 1.05385 3.933z" />
    </g>
  </svg>
);

export function SignupForm() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  const validateInputs = () => {
    if (!name.trim()) {
      setError("Preenche o teu nome");
      return false;
    }
    if (!team.trim()) {
      setError("Preenche o nome da equipa");
      return false;
    }
    if (!email.trim()) {
      setError("Preenche o email");
      return false;
    }
    if (!password) {
      setError("Preenche a password");
      return false;
    }
    if (password.length < 6) {
      setError("Password deve ter pelo menos 6 caracteres");
      return false;
    }
    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateInputs()) return;

    setLoading(true);

    const { error: signUpError } = await signUp(email, password, name, team);

    if (signUpError) {
      console.error("Sign up error:", signUpError);
      setError((signUpError as any).message || "Erro ao criar conta");
    } else {
      router.push("/login");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white w-screen">
      <div className="mx-auto w-full space-y-2 text-center flex flex-col items-center">
        <div className="space-y-1 mb-8">
          <img src="/logo.svg" alt="Flowtex" width={96} height={96} className="mx-auto" />
          <h1 className="text-5xl font-semibold text-gray-900 whitespace-nowrap">Create account</h1>
        </div>

        <div className="space-y-4 w-full max-w-xs">
          <Button variant="outline" className="w-full justify-center gap-2 text-gray-900 border-2 border-[#00D4A4] text-center">
            <svg fill="currentColor" viewBox="0 0 24 24" className="h-4 w-4">
              <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
            </svg>
            Sign up with Google
          </Button>

          <div className="relative flex items-center">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-4 text-sm text-gray-600 bg-white whitespace-nowrap">or sign up with email</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4 w-full max-w-xs">
            {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
            <div>
              <Label htmlFor="name" className="text-gray-900 block text-left">Full Name</Label>
              <div className="relative mt-2.5">
                <Input
                  id="name"
                  className="peer ps-9 bg-white border-gray-200"
                  placeholder="Your Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <div className="text-gray-500 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="team" className="text-gray-900 block text-left">Team Name</Label>
              <div className="relative mt-2.5">
                <Input
                  id="team"
                  className="peer ps-9 bg-white border-gray-200"
                  placeholder="Your Team"
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  required
                />
                <div className="text-gray-500 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="signup-email" className="text-gray-900 block text-left">Email</Label>
              <div className="relative mt-2.5">
                <Input
                  id="signup-email"
                  className="peer ps-9 bg-white border-gray-200"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="text-gray-500 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="m2 6 10 7 10-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="signup-password" className="text-gray-900 block text-left">Password</Label>
              <div className="relative mt-2.5">
                <Input
                  id="signup-password"
                  className="ps-9 pe-9 bg-white border-gray-200"
                  placeholder="Enter your password"
                  type={isVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="text-gray-500 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 11H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2zm0 9H5v-7h14v7z" />
                    <path d="M12 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </div>
                <button
                  className="text-gray-500 hover:text-gray-900 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-colors outline-none disabled:opacity-50"
                  type="button"
                  onClick={toggleVisibility}
                  aria-label={isVisible ? "Hide password" : "Show password"}
                >
                  {isVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <PasswordStrengthMeter password={password} className="mt-4" />
            </div>

            <div className="flex items-center gap-2 pt-1 justify-center">
              <Checkbox id="agree" />
              <Label htmlFor="agree" className="text-gray-900">
                I agree to{" "}
                <a href="/terms" className="text-[#00D4A4] underline hover:text-[#00A882]">
                  Terms
                </a>
              </Label>
            </div>

            <Button type="submit" className="w-full text-center mt-6" disabled={loading}>
              {loading ? "Criando conta..." : "Create account"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginForm() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  const validateInputs = () => {
    if (!email.trim()) {
      setError("Preenche o email");
      return false;
    }
    if (!password) {
      setError("Preenche a password");
      return false;
    }
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateInputs()) return;

    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      console.error("Sign in error:", signInError);
      setError((signInError as any).message || "Email ou password incorretos");
    } else {
      router.push("/");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white w-screen">
      <div className="mx-auto w-full space-y-2 text-center flex flex-col items-center">
        <div className="space-y-1 mb-8 text-center">
          <img src="/logo.svg" alt="Flowtex" width={96} height={96} className="mx-auto" />
          <h1 className="text-5xl font-semibold text-gray-900 whitespace-nowrap">Welcome back</h1>
        </div>

        <div className="space-y-4 w-full max-w-xs">
          <Button variant="outline" className="w-full justify-center gap-2 text-gray-900 border-2 border-[#00D4A4] text-center">
            <svg fill="currentColor" viewBox="0 0 24 24" className="h-4 w-4">
              <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
            </svg>
            Sign in with Google
          </Button>

          <div className="relative flex items-center">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-4 text-sm text-gray-600 bg-white">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4 w-full max-w-xs">
            {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
            <div>
              <Label htmlFor="login-email" className="text-gray-900 block text-left">Email</Label>
              <div className="relative mt-2.5">
                <Input
                  id="login-email"
                  className="peer ps-9 bg-white border-gray-200"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="text-gray-500 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="m2 6 10 7 10-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-gray-900 block text-left">Password</Label>
                <a href="#" className="text-sm text-primary hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative mt-2.5">
                <Input
                  id="login-password"
                  className="ps-9 pe-9 bg-white border-gray-200"
                  placeholder="Enter your password"
                  type={isVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="text-gray-500 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 11H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2zm0 9H5v-7h14v7z" />
                    <path d="M12 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </div>
                <button
                  className="text-gray-500 hover:text-gray-900 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-colors outline-none disabled:opacity-50"
                  type="button"
                  onClick={toggleVisibility}
                  aria-label={isVisible ? "Hide password" : "Show password"}
                >
                  {isVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 justify-center">
              <Checkbox id="remember-me" />
              <Label htmlFor="remember-me" className="text-gray-900 text-center">Remember for 30 days</Label>
            </div>

            <Button type="submit" className="w-full text-center" disabled={loading}>
              {loading ? "Fazendo login..." : "Sign in"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            No account?{" "}
            <a href="/signup" className="text-primary font-medium hover:underline">
              Create an account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
