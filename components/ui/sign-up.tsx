import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

interface SignUpPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignUp?: () => void;
  onSignIn?: () => void;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-[#C8D8E6] bg-white/50 backdrop-blur-sm transition-all focus-within:border-[#00D4A4]/70 focus-within:bg-[#F0FDFB]">
    {children}
  </div>
);

export const SignUpPage: React.FC<SignUpPageProps> = ({
  title = <span className="font-light text-[#0D1F2D] tracking-tight">Create Account</span>,
  description = "Join Flowtex and get early access",
  onSignUp,
  onGoogleSignUp,
  onSignIn,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-[#0D1F2D]">{title}</h1>
            <p className="text-[#7A96AA] mt-2">{description}</p>
          </div>

          <form className="space-y-4" onSubmit={onSignUp}>
            <div>
              <label className="text-sm font-semibold text-[#2E4A62] block mb-2">Full Name</label>
              <GlassInputWrapper>
                <input
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-transparent text-sm p-3 rounded-lg focus:outline-none text-[#0D1F2D] placeholder-[#7A96AA]"
                />
              </GlassInputWrapper>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#2E4A62] block mb-2">Email Address</label>
              <GlassInputWrapper>
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-sm p-3 rounded-lg focus:outline-none text-[#0D1F2D] placeholder-[#7A96AA]"
                />
              </GlassInputWrapper>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#2E4A62] block mb-2">Password</label>
              <GlassInputWrapper>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    className="w-full bg-transparent text-sm p-3 pr-10 rounded-lg focus:outline-none text-[#0D1F2D] placeholder-[#7A96AA]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-[#7A96AA] hover:text-[#2E4A62]" />
                    ) : (
                      <Eye className="w-5 h-5 text-[#7A96AA] hover:text-[#2E4A62]" />
                    )}
                  </button>
                </div>
              </GlassInputWrapper>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#2E4A62] block mb-2">Confirm Password</label>
              <GlassInputWrapper>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className="w-full bg-transparent text-sm p-3 pr-10 rounded-lg focus:outline-none text-[#0D1F2D] placeholder-[#7A96AA]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5 text-[#7A96AA] hover:text-[#2E4A62]" />
                    ) : (
                      <Eye className="w-5 h-5 text-[#7A96AA] hover:text-[#2E4A62]" />
                    )}
                  </button>
                </div>
              </GlassInputWrapper>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="agree"
                id="agree"
                className="w-4 h-4 rounded border-[#C8D8E6] accent-[#00D4A4] mt-1"
              />
              <label htmlFor="agree" className="text-sm text-[#2E4A62]">
                I agree to the{' '}
                <a href="#" className="text-[#00D4A4] hover:underline font-semibold">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#00D4A4] hover:underline font-semibold">
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#00D4A4] py-3 font-semibold text-[#0D1F2D] hover:bg-[#00A882] transition-colors mt-6"
            >
              Create Account
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <span className="w-full border-t border-[#C8D8E6]"></span>
            <span className="px-4 text-sm text-[#7A96AA] bg-[#F8FAFC] absolute">Or continue with</span>
          </div>

          <button
            onClick={onGoogleSignUp}
            className="w-full flex items-center justify-center gap-3 border border-[#C8D8E6] rounded-lg py-3 hover:bg-white/50 transition-colors font-semibold text-[#2E4A62]"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-center text-sm text-[#7A96AA]">
            Already have an account?{' '}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onSignIn?.(); }}
              className="text-[#00D4A4] hover:underline transition-colors font-semibold"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
